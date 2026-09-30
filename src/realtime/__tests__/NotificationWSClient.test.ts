import { notificationWSClient } from '../NotificationWSClient';
import type { ConnectionStatus } from '../NotificationWSClient';
import { showErrorToast, showInfoToast } from '@/lib/toast';

jest.mock('@/lib/toast', () => ({
  showErrorToast: jest.fn(),
  showInfoToast: jest.fn(),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Partial<Event>) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null = null;
  onerror: ((event: Partial<Event>) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({});
    }, 0);
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSING;
    this.onclose?.({ code, reason, wasClean: code === 1000 });
    this.readyState = MockWebSocket.CLOSED;
  }

  triggerMessage(data: unknown) {
    this.onmessage?.({ data });
  }

  triggerError() {
    this.onerror?.({});
  }

  send() {}
}

const flushMicrotasks = async () => {
  await Promise.resolve();
};

let dateNowSpy: jest.SpyInstance<number, []>;
let originalWebSocket: typeof WebSocket | undefined;
let infoSpy: jest.SpyInstance;
let warningSpy: jest.SpyInstance;
type MutableGlobal = typeof globalThis & { WebSocket?: typeof WebSocket };
const mutableGlobal = globalThis as MutableGlobal;

beforeEach(() => {
  infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.useFakeTimers();
  let now = 0;
  dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => {
    now += 6000;
    return now;
  });
  MockWebSocket.instances = [];
  originalWebSocket = mutableGlobal.WebSocket;
  mutableGlobal.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  (showErrorToast as jest.Mock).mockClear();
  (showInfoToast as jest.Mock).mockClear();
});

afterEach(() => {
  notificationWSClient.disconnect();
  if (originalWebSocket) {
    mutableGlobal.WebSocket = originalWebSocket;
  } else {
    delete (mutableGlobal as { WebSocket?: typeof WebSocket }).WebSocket;
  }
  jest.useRealTimers();
  dateNowSpy.mockRestore();
  try {
    for (const call of infoSpy.mock.calls)
      expect(call[0]).toMatch(
        /^NotificationWS (connecting to|connected|disconnected|attempting reconnect)$/,
      );
    for (const call of warningSpy.mock.calls)
      expect(call[0]).toMatch(
        /^NotificationWS (connection closed \(1006\) - scheduling retry|stopped due to unauthorized response|encountered an error)$/,
      );
  } finally {
    infoSpy.mockRestore();
    warningSpy.mockRestore();
  }
});

describe('NotificationWSClient', () => {
  it('requiere token y evita conexiones duplicadas mientras conecta', () => {
    expect(() => notificationWSClient.connect('')).toThrow(/JWT token/);
    notificationWSClient.connect('jwt-token');
    notificationWSClient.connect('jwt-token');
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(new URL(MockWebSocket.instances[0].url).searchParams.get('token')).toBe('jwt-token');
  });

  it('limpia listeners y socket al desconectar', async () => {
    const listener = jest.fn();
    const unsubscribe = notificationWSClient.onNotification(listener);
    notificationWSClient.connect('jwt-token');
    jest.runOnlyPendingTimers();
    const socket = MockWebSocket.instances[0];
    unsubscribe();
    notificationWSClient.disconnect();
    expect(socket.onmessage).toBeNull();
    expect(notificationWSClient.getStatus()).toBe('disconnected');
    expect(listener).not.toHaveBeenCalled();
  });

  it('no duplica un listener registrado dos veces', () => {
    const listener = jest.fn();
    const unsubscribeOne = notificationWSClient.onNotification(listener);
    const unsubscribeTwo = notificationWSClient.onNotification(listener);
    notificationWSClient.connect('jwt-token');
    jest.runOnlyPendingTimers();
    MockWebSocket.instances[0].triggerMessage(
      JSON.stringify({
        id: 'notice',
        type: 'generic',
        title: 'Aviso',
        message: 'Texto',
        payload: null,
        created_at: '2026-09-29T00:00:00Z',
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribeOne();
    unsubscribeTwo();
  });

  it('acota los intentos de reconexión', async () => {
    notificationWSClient.connect('jwt-token');
    jest.runOnlyPendingTimers();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const socket = MockWebSocket.instances.at(-1);
      socket?.close(1006, 'network');
      jest.runOnlyPendingTimers();
      await flushMicrotasks();
    }
    expect(MockWebSocket.instances.length).toBeLessThanOrEqual(6);
    expect(notificationWSClient.getStatus()).toBe('disconnected');
  });
  it('emits status changes on successful connection', async () => {
    const statuses: ConnectionStatus[] = [];
    const unsubscribe = notificationWSClient.onStatusChange((status) => {
      statuses.push(status);
    });

    notificationWSClient.connect('jwt-token');
    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    expect(statuses).toContain('connecting');
    expect(statuses).toContain('connected');

    unsubscribe();
  });

  it('dispatches notifications received via WebSocket', async () => {
    const handler = jest.fn();
    const unsubscribe = notificationWSClient.onNotification(handler);

    notificationWSClient.connect('jwt-token');
    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    const socket = MockWebSocket.instances.at(-1);
    expect(socket).toBeDefined();

    const payload = {
      id: 'notif-1',
      type: 'generic',
      title: 'Test',
      message: 'Mensaje',
      payload: null,
      created_at: '2025-01-01T10:00:00Z',
    };

    socket?.triggerMessage(JSON.stringify(payload));

    expect(handler).toHaveBeenCalledWith(payload);
    unsubscribe();
  });

  it('stops reconnecting after unauthorized close', async () => {
    notificationWSClient.connect('expired-token');
    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    const socket = MockWebSocket.instances.at(-1);
    socket?.close(4401, 'Unauthorized');

    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(showErrorToast).toHaveBeenCalledWith(
      'Tu sesion expiro para notificaciones. Inicia sesion nuevamente.',
    );
  });

  it('emits info toast on recoverable error and schedules reconnect', async () => {
    notificationWSClient.connect('jwt-token');
    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    const socket = MockWebSocket.instances.at(-1);
    socket?.triggerError();
    socket?.close(1006, 'Abnormal Closure');

    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    expect(showInfoToast).toHaveBeenCalled();
    expect(MockWebSocket.instances.length).toBeGreaterThan(1);
  });
});
