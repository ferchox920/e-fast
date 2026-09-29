import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { authApi } from '../authApi';
import { baseApi } from '../baseApi';
import { rootReducer } from '@/store/rootReducer';
import { server } from '@/test-utils/msw/server';

const url = 'http://localhost:8000/api/v1/auth/login';
const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
const user = {
  id: '18e72550-46b8-4545-b924-2df6db39dc70',
  email: 'user@example.test',
  full_name: 'User',
  is_active: true,
  is_superuser: false,
  email_verified: true,
};

describe('login RTK Query contra el contrato OAuth2PasswordRequestForm', () => {
  it('envía form data y guarda tokens solo en memoria', async () => {
    server.use(
      http.post(url, async ({ request }) => {
        expect(request.headers.get('content-type')).toContain('application/x-www-form-urlencoded');
        const body = new URLSearchParams(await request.text());
        expect(body.get('username')).toBe(user.email);
        expect(body.get('password')).toBe('Password123!');
        return HttpResponse.json({
          access_token: 'access',
          refresh_token: 'refresh',
          token_type: 'bearer',
          expires_in: 900,
          user,
        });
      }),
    );
    const store = makeStore();
    await store
      .dispatch(authApi.endpoints.login.initiate({ email: user.email, password: 'Password123!' }))
      .unwrap();
    expect(store.getState().user.session.accessToken).toBe('access');
    expect(store.getState().user.session.refreshToken).toBe('refresh');
  });

  it('rechaza credenciales inválidas sin intentar refresh', async () => {
    let refreshCount = 0;
    server.use(
      http.post(url, () =>
        HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 }),
      ),
      http.post('http://localhost:8000/api/v1/auth/refresh', () => {
        refreshCount += 1;
        return HttpResponse.json({});
      }),
    );
    const store = makeStore();
    await expect(
      store
        .dispatch(authApi.endpoints.login.initiate({ email: user.email, password: 'wrong' }))
        .unwrap(),
    ).rejects.toMatchObject({ status: 401 });
    expect(refreshCount).toBe(0);
    expect(store.getState().user.session.accessToken).toBeNull();
  });
});
