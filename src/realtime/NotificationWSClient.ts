import type { NotificationWsPayload } from '@/types/notifications';
import { ZWsPayload } from '@/types/notifications';
import { showErrorToast, showInfoToast } from '@/lib/toast';

type NotificationCallback = (payload: NotificationWsPayload) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const DEFAULT_HTTP_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000/api/v1';

const DEFAULT_WS_BASE = (
  process.env.NEXT_PUBLIC_API_WS_BASE_URL ??
  DEFAULT_HTTP_BASE.replace(/^http/i, (match) => (match.toLowerCase() === 'https' ? 'wss' : 'ws'))
).replace(/\/$/, '');

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

  connect(jwt: string) {
    if (!jwt) throw new Error('JWT token is required to connect to notifications websocket');
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
    this.clearReconnectTimer();
    this.createSocket(jwt);
  }

  disconnect() {
    this.closeIntent = CloseIntent.Intentional;
    this.shouldAttemptReconnect = false;
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;
    this.token = null;
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
    const url = this.buildUrl(jwt);
    const sanitizedUrl = `${url.origin}${url.pathname}`;

    try {
      this.socket = new WebSocket(url.toString());
      this.setStatus('connecting');
    } catch (error) {
      console.error('NotificationWS connection error', error);
      this.setStatus('disconnected');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.shouldAttemptReconnect = true;
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
        this.shouldAttemptReconnect = false;
        this.token = null;
        this.clearReconnectTimer();
        this.emitToast('error', 'Tu sesion expiro para notificaciones. Inicia sesion nuevamente.');
        return;
      }

      console.warn(`NotificationWS connection closed (${event.code}) - scheduling retry`);
      this.emitToast('info', 'Reconectando notificaciones...');
      this.scheduleReconnect();
    };
  }

  private buildUrl(jwt: string) {
    const url = new URL(`${DEFAULT_WS_BASE}/notifications/ws`);
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

  private scheduleReconnect() {
    if (!this.token || !this.shouldAttemptReconnect) return;
    this.clearReconnectTimer();

    const baseDelay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_DELAY_MS,
    );
    const jitterFactor = 0.8 + Math.random() * 0.4;
    const delay = Math.min(RECONNECT_MAX_DELAY_MS, Math.round(baseDelay * jitterFactor));

    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      if (!this.token || !this.shouldAttemptReconnect) return;
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
