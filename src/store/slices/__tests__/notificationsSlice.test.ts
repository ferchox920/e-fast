import notificationsReducer, {
  markRead,
  replaceNotification,
  upsertMany,
  upsertOne,
  selectNotificationEntities,
  selectNotificationIds,
  selectNotificationsOrdered,
  selectUnreadCount,
  selectNotificationsPage,
} from '../notificationsSlice';
import type { NotificationRead } from '@/types/notifications';
import { normalizeNotification } from '@/notifications/normalize';
import { baseApi } from '@/store/api/baseApi';
import type { RootState } from '@/store';

const createNotification = (override: Partial<NotificationRead> = {}): NotificationRead => ({
  id: `notif-${Math.random().toString(16).slice(2)}`,
  user_id: 'user-1',
  type: 'generic',
  title: 'Titulo',
  message: 'Mensaje',
  is_read: false,
  payload: null,
  created_at: new Date().toISOString(),
  read_at: null,
  ...override,
});

const makeRootState = (notificationsState: ReturnType<typeof notificationsReducer>): RootState =>
  ({
    user: { current: null, token: null, refresh_token: null },
    notifications: notificationsState,
    [baseApi.reducerPath]: baseApi.reducer(undefined, { type: 'init' }),
  }) as unknown as RootState;

describe('notificationsSlice reducers', () => {
  it('upsertMany stores notifications ordered by created_at desc', () => {
    const initialState = notificationsReducer(undefined, { type: 'init' });

    const older = createNotification({
      id: 'a',
      created_at: '2025-01-01T09:00:00Z',
    });
    const newer = createNotification({
      id: 'b',
      created_at: '2025-01-01T10:00:00Z',
    });

    const nextState = notificationsReducer(initialState, upsertMany([older, newer]));
    const root = makeRootState(nextState);
    expect(selectNotificationIds(root)).toEqual(['b', 'a']);
    expect(selectUnreadCount(root)).toBe(2);
  });

  it('upsertOne merges meta and preserves existing fields', () => {
    const base = createNotification({
      id: 'notif-1',
      type: 'product_question',
      payload: { question_id: 1, product_id: 2 },
    });
    const updated = createNotification({
      id: 'notif-1',
      type: 'product_question',
      payload: { question_id: 1, product_id: 2 },
      message: 'Nuevo mensaje',
    });

    const stateAfterInsert = notificationsReducer(undefined, upsertOne(base));
    const stateAfterMerge = notificationsReducer(stateAfterInsert, upsertOne(updated));
    const root = makeRootState(stateAfterMerge);

    expect(selectNotificationIds(root)).toEqual(['notif-1']);
    expect(selectNotificationsOrdered(root)[0]?.message).toBe('Nuevo mensaje');
    expect(selectNotificationsOrdered(root)[0]?.meta?.href).toBeDefined();
  });

  it('markRead updates read flag and timestamp', () => {
    const notification = createNotification({ id: 'notif-read' });
    const stateAfterInsert = notificationsReducer(undefined, upsertOne(notification));

    const stateAfterMark = notificationsReducer(
      stateAfterInsert,
      markRead({ id: 'notif-read', is_read: true }),
    );

    const entity = selectNotificationEntities(makeRootState(stateAfterMark))['notif-read'];
    expect(entity?.is_read).toBe(true);
    expect(entity?.read_at).not.toBeNull();

    const stateAfterUndo = notificationsReducer(
      stateAfterMark,
      markRead({ id: 'notif-read', is_read: false }),
    );
    expect(selectNotificationEntities(makeRootState(stateAfterUndo))['notif-read']?.is_read).toBe(
      false,
    );
  });

  it('replaceNotification overwrites entity and recalculates derived data', () => {
    const initial = notificationsReducer(undefined, upsertOne(createNotification({ id: 'x' })));
    const replacement = normalizeNotification(
      createNotification({
        id: 'x',
        is_read: true,
        read_at: '2025-01-01T12:00:00Z',
        created_at: '2025-01-02T12:00:00Z',
      }),
    );

    if (!replacement) {
      throw new Error('Expected normalized notification');
    }

    const state = notificationsReducer(initial, replaceNotification(replacement));
    const root = makeRootState(state);

    expect(selectUnreadCount(root)).toBe(0);
    expect(selectNotificationIds(root)).toEqual(['x']);
  });

  it('selectNotificationsPage applies limit and offset', () => {
    const first = createNotification({ id: '1', created_at: '2025-01-01T10:00:00Z' });
    const second = createNotification({ id: '2', created_at: '2025-01-01T11:00:00Z' });
    const third = createNotification({ id: '3', created_at: '2025-01-01T12:00:00Z' });

    let state = notificationsReducer(undefined, upsertMany([first, second, third]));
    state = notificationsReducer(state, markRead({ id: '2', is_read: true }));

    const root = makeRootState(state);

    expect(selectNotificationsPage(root, 2, 0).map((n) => n?.id)).toEqual(['3', '2']);
    expect(selectNotificationsPage(root, 1, 2).map((n) => n?.id)).toEqual(['1']);
    expect(selectUnreadCount(root)).toBe(2);
  });
});
