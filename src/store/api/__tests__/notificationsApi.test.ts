import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';

import { notificationsApi } from '../notificationsApi';
import notificationsReducer from '@/store/slices/notificationsSlice';
import userReducer from '@/store/slices/userSlice';
import { server } from '@/test-utils/msw/server';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

const createStore = () =>
  configureStore({
    reducer: {
      notifications: notificationsReducer,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
      user: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(notificationsApi.middleware),
    preloadedState: {
      user: {
        current: null,
        token: 'test-token',
        refresh_token: null,
      },
    },
  });

describe('notificationsApi', () => {
  it('fetches notifications list sorted by created_at desc', async () => {
    server.use(
      http.get(`${API_BASE}/notifications`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('limit')).toBe('5');
        expect(url.searchParams.get('offset')).toBe('0');

        return HttpResponse.json({
          items: [
            {
              id: 'older',
              user_id: 'user-1',
              type: 'generic',
              title: 'Old',
              message: 'Older notification',
              payload: null,
              is_read: true,
              created_at: '2025-01-01T10:00:00Z',
              read_at: '2025-01-02T10:00:00Z',
            },
            {
              id: 'newer',
              user_id: 'user-1',
              type: 'generic',
              title: 'New',
              message: 'Newer notification',
              payload: null,
              is_read: false,
              created_at: '2025-01-02T10:00:00Z',
              read_at: null,
            },
          ],
          total: 2,
          limit: 5,
          offset: 0,
        });
      }),
    );

    const store = createStore();
    const result = await store.dispatch(
      notificationsApi.endpoints.listNotifications.initiate({ limit: 5, offset: 0 }),
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.items.map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('updates notification read status via PATCH', async () => {
    const patchSpy = jest.fn();

    server.use(
      http.patch(`${API_BASE}/notifications/:id`, async ({ request, params }) => {
        const body = (await request.json()) as { is_read: boolean };
        patchSpy(body);

        return HttpResponse.json({
          id: params.id,
          user_id: 'user-1',
          type: 'generic',
          title: 'Updated',
          message: 'Updated message',
          payload: null,
          is_read: body.is_read,
          created_at: '2025-01-02T10:00:00Z',
          read_at: body.is_read ? '2025-01-02T12:00:00Z' : null,
        });
      }),
    );

    const store = createStore();
    const result = await store.dispatch(
      notificationsApi.endpoints.updateNotification.initiate({ id: 'target', is_read: true }),
    );

    expect(patchSpy).toHaveBeenCalledWith({ is_read: true });
    expect(result.error).toBeUndefined();
    expect(result.data?.is_read).toBe(true);
  });
});
