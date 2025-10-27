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
type MutableGlobal = typeof globalThis & { WebSocket?: typeof WebSocket };
const mutableGlobal = globalThis as MutableGlobal;

beforeEach(() => {
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
});

describe('NotificationWSClient', () => {
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
      user_id: 'user-1',
      type: 'generic',
      title: 'Test',
      message: 'Mensaje',
      payload: null,
      is_read: false,
      created_at: '2025-01-01T10:00:00Z',
      read_at: null,
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
