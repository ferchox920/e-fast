import type { NotificationWsPayload } from '@/types/notifications';
import { ZWsPayload } from '@/types/notifications';
import { showErrorToast, showInfoToast } from '@/lib/toast';

type NotificationCallback = (payload: NotificationWsPayload) => void;
type StatusCallback = (status: ConnectionStatus) => void;
export type TokenProvider = () => Promise<string | null>;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const decodeJwtPayload = (segment: string) => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof atob === 'function') {
    return atob(padded);
  }

  const bufferCtor = (globalThis as { Buffer?: typeof Buffer }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(padded, 'base64').toString('utf-8');
  }

  throw new Error('No base64 decoder available');
};

const isExpired = (jwt: string) => {
  try {
    const [, payload] = jwt.split('.');
    if (!payload) return false;
    const parsed = JSON.parse(decodeJwtPayload(payload));
    const exp = typeof parsed === 'object' && parsed ? parsed.exp : null;
    if (typeof exp !== 'number') return false;
    return Math.floor(Date.now() / 1000) >= exp;
  } catch {
    return false;
  }
};

const normalizeWsBase = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    let protocol = url.protocol;

    if (protocol === 'http:') protocol = 'ws:';
    if (protocol === 'https:') protocol = 'wss:';
    if (protocol !== 'ws:' && protocol !== 'wss:') return null;

    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${protocol}//${url.host}${path}`;
  } catch {
    return null;
  }
};

const buildWsBaseCandidates = () => {
  const seen = new Set<string>();
  const add = (candidate?: string | null) => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    candidates.push(candidate);
  };

  const candidates: string[] = [];

  const appendLocalVariants = (url: URL) => {
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    const portSegment = url.port ? `:${url.port}` : '';
    add(normalizeWsBase(`ws://localhost${portSegment}${path}`));
    add(normalizeWsBase(`ws://127.0.0.1${portSegment}${path}`));
  };

  add(normalizeWsBase(process.env.NEXT_PUBLIC_API_WS_BASE_URL));

  const httpBases = [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://localhost:8000/api/v1',
    'http://127.0.0.1:8000/api/v1',
  ];

  httpBases.forEach((raw) => {
    if (!raw) return;
    try {
      const url = new URL(raw);
      const pathCandidate = normalizeWsBase(`${url.protocol}//${url.host}${url.pathname}`);
      add(pathCandidate);
      const originCandidate = normalizeWsBase(`${url.protocol}//${url.host}`);
      add(originCandidate);
      appendLocalVariants(url);
    } catch {
      // ignore invalid URLs
    }
  });

  add('ws://localhost:8000/api/v1');
  add('ws://127.0.0.1:8000/api/v1');

  return candidates.length ? candidates : ['ws://127.0.0.1:8000/api/v1'];
};

const WS_BASE_CANDIDATES = buildWsBaseCandidates();

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const TOAST_COOLDOWN_MS = 5000;

const UNAUTHORIZED_CLOSE_CODES = new Set([4001, 4401, 4010, 401, 4403, 1008]);

const enum CloseIntent {
  Unknown,
  Intentional,
}

export class NotificationWSClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private closeIntent: CloseIntent = CloseIntent.Unknown;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<NotificationCallback>();
  private statusListeners = new Set<StatusCallback>();
  private status: ConnectionStatus = 'disconnected';
  private shouldAttemptReconnect = true;
  private lastToastAt = 0;
  private wsBaseIndex = 0;
  private preferredWsBaseIndex = 0;
  private hasConnectedInCurrentSession = false;
  private refreshedAfterUnauthorized = false;
  private readonly getFreshToken?: TokenProvider;

  constructor(getFreshToken?: TokenProvider) {
    this.getFreshToken = getFreshToken;
  }

  connect(jwt: string) {
    if (!jwt) throw new Error('JWT token is required to connect to notifications websocket');
    if (isExpired(jwt)) {
      this.emitToast('error', 'Tu sesion de notificaciones expiro. Vuelve a iniciar sesion.');
      this.setStatus('disconnected');
      return;
    }
    if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
      throw new Error('WebSocket is not available in this environment');
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close(1000, 'Reconnecting');
      this.socket = null;
    }

    this.token = jwt;
    this.closeIntent = CloseIntent.Unknown;
    this.shouldAttemptReconnect = true;
    this.reconnectAttempts = 0;
    this.wsBaseIndex = this.preferredWsBaseIndex;
    this.hasConnectedInCurrentSession = false;
    this.refreshedAfterUnauthorized = false;
    this.clearReconnectTimer();
    this.createSocket(jwt);
  }

  disconnect() {
    this.closeIntent = CloseIntent.Intentional;
    this.shouldAttemptReconnect = false;
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;
    this.token = null;
    this.wsBaseIndex = this.preferredWsBaseIndex;
    this.hasConnectedInCurrentSession = false;
    this.refreshedAfterUnauthorized = false;
    this.setStatus('disconnected');

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.cleanupSocket();
    }
  }

  isConnected() {
    return this.status === 'connected';
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onNotification(callback: NotificationCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onStatusChange(callback: StatusCallback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  private createSocket(jwt: string) {
    if (!this.shouldAttemptReconnect) return;

    this.clearReconnectTimer();
    this.closeIntent = CloseIntent.Unknown;
    const base = WS_BASE_CANDIDATES[this.wsBaseIndex] ?? WS_BASE_CANDIDATES[0];
    const url = this.buildUrl(base, jwt);
    const sanitizedUrl = `${url.origin}${url.pathname}`;
    console.info('NotificationWS connecting to', sanitizedUrl);

    try {
      this.socket = new WebSocket(url.toString());
      this.setStatus('connecting');
    } catch (error) {
      console.error('NotificationWS connection error', error);
      this.setStatus('disconnected');
      this.advanceWsBaseCandidate();
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.shouldAttemptReconnect = true;
      this.hasConnectedInCurrentSession = true;
      this.preferredWsBaseIndex = this.wsBaseIndex;
      this.refreshedAfterUnauthorized = false;
      this.setStatus('connected');
      console.info('NotificationWS connected', sanitizedUrl);
    };

    this.socket.onmessage = (event) => {
      const raw = event.data;

      if (typeof raw !== 'string') {
        console.warn('NotificationWS received non-string message');
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        console.warn('NotificationWS failed to parse message', error);
        return;
      }

      const validation = ZWsPayload.safeParse(parsed);
      if (!validation.success) {
        console.warn('NotificationWS received invalid payload');
        return;
      }

      this.broadcast(validation.data);
    };

    this.socket.onerror = () => {
      console.warn('NotificationWS encountered an error');
      this.emitToast('info', 'Detectamos un problema con las notificaciones. Reintentaremos.');
    };

    this.socket.onclose = (event) => {
      const intentionalClose = this.closeIntent === CloseIntent.Intentional;
      this.cleanupSocket();
      this.setStatus('disconnected');

      if (intentionalClose) {
        console.info('NotificationWS disconnected');
        return;
      }

      const unauthorized = this.isUnauthorizedClose(event);

      if (unauthorized) {
        console.warn('NotificationWS stopped due to unauthorized response', event.code);
        this.hasConnectedInCurrentSession = false;
        this.clearReconnectTimer();

        if (this.getFreshToken && !this.refreshedAfterUnauthorized) {
          this.refreshedAfterUnauthorized = true;
          this.emitToast('info', 'Renovando tu sesion de notificaciones...');
          this.scheduleReconnect({ attemptTokenRefresh: true });
          return;
        }

        this.shouldAttemptReconnect = false;
        this.token = null;
        this.emitToast('error', 'Tu sesion expiro para notificaciones. Inicia sesion nuevamente.');
        return;
      }

      console.warn(`NotificationWS connection closed (${event.code}) - scheduling retry`);
      this.emitToast('info', 'Reconectando notificaciones...');
      if (!this.hasConnectedInCurrentSession) {
        this.advanceWsBaseCandidate();
      }
      this.hasConnectedInCurrentSession = false;
      this.scheduleReconnect();
    };
  }

  private buildUrl(base: string, jwt: string) {
    const normalizedBase = base.replace(/\/$/, '');
    const url = new URL(`${normalizedBase}/notifications/ws`);
    url.searchParams.set('token', jwt);

    if (!url.protocol.startsWith('ws')) {
      throw new Error(`Invalid WebSocket protocol for ${url}`);
    }

    if (process.env.NODE_ENV === 'production' && url.protocol !== 'wss:') {
      throw new Error('Secure WebSocket (wss://) is required in production environments');
    }

    return url;
  }

  private broadcast(payload: NotificationWsPayload) {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error('NotificationWS listener error', error);
      }
    });
  }

  private scheduleReconnect(options: { attemptTokenRefresh?: boolean } = {}) {
    if (!this.shouldAttemptReconnect) return;
    this.clearReconnectTimer();

    const baseDelay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_DELAY_MS,
    );
    const jitterFactor = 0.8 + Math.random() * 0.4;
    const delay = Math.min(RECONNECT_MAX_DELAY_MS, Math.round(baseDelay * jitterFactor));

    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(async () => {
      if (!this.shouldAttemptReconnect) return;

      const requiresRefresh =
        options.attemptTokenRefresh || (this.token ? isExpired(this.token) : true);

      if (this.getFreshToken && requiresRefresh) {
        try {
          const freshToken = await this.getFreshToken();
          if (freshToken) {
            this.token = freshToken;
          } else if (!this.token) {
            this.shouldAttemptReconnect = false;
            this.emitToast('error', 'Tu sesion de notificaciones expiro. Vuelve a iniciar sesion.');
            return;
          }
        } catch (error) {
          console.error('NotificationWS token refresh failed', error);
          this.shouldAttemptReconnect = false;
          this.emitToast('error', 'No pudimos renovar tu sesion de notificaciones.');
          return;
        }
      }

      if (!this.token || isExpired(this.token)) {
        this.shouldAttemptReconnect = false;
        this.emitToast('error', 'Tu sesion de notificaciones expiro. Vuelve a iniciar sesion.');
        return;
      }

      console.info('NotificationWS attempting reconnect');
      this.closeIntent = CloseIntent.Unknown;
      this.createSocket(this.token);
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private cleanupSocket() {
    if (!this.socket) return;
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
    this.socket = null;
  }

  private advanceWsBaseCandidate() {
    if (this.wsBaseIndex < WS_BASE_CANDIDATES.length - 1) {
      this.wsBaseIndex += 1;
      const fallbackBase = WS_BASE_CANDIDATES[this.wsBaseIndex];
      if (!this.hasConnectedInCurrentSession) {
        this.preferredWsBaseIndex = this.wsBaseIndex;
      }
      console.info('NotificationWS switching to fallback WebSocket base', fallbackBase);
    }
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('NotificationWS status listener error', error);
      }
    });
  }

  private isUnauthorizedClose(event: CloseEvent) {
    if (UNAUTHORIZED_CLOSE_CODES.has(event.code)) return true;
    if (event.code === 1006 && this.token && isExpired(this.token)) return true;
    const reason = event.reason?.toLowerCase() ?? '';
    return reason.includes('unauthorized') || reason.includes('401');
  }

  private emitToast(type: 'error' | 'info', message: string) {
    const now = Date.now();
    if (now - this.lastToastAt < TOAST_COOLDOWN_MS) return;
    this.lastToastAt = now;

    if (type === 'error') {
      showErrorToast(message);
    } else {
      showInfoToast(message);
    }
  }
}

export const notificationWSClient = new NotificationWSClient();
