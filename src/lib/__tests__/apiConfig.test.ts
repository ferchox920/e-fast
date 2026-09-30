import { getApiBaseUrl, getWebSocketBaseUrl, isAllowedWebSocketTransport } from '../apiConfig';

const initial = process.env.NEXT_PUBLIC_API_BASE_URL;
const initialWs = process.env.NEXT_PUBLIC_API_WS_BASE_URL;
it('permite ws local en build de producción y exige wss fuera de loopback', () => {
  expect(isAllowedWebSocketTransport(new URL('ws://127.0.0.1:8000'), 'localhost')).toBe(true);
  expect(isAllowedWebSocketTransport(new URL('ws://api.example.com'), 'localhost')).toBe(false);
  expect(isAllowedWebSocketTransport(new URL('ws://localhost:8000'), 'shop.example.com')).toBe(
    false,
  );
  expect(isAllowedWebSocketTransport(new URL('wss://api.example.com'), 'shop.example.com')).toBe(
    true,
  );
});
afterEach(() => {
  if (initial === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
  else process.env.NEXT_PUBLIC_API_BASE_URL = initial;
  if (initialWs === undefined) delete process.env.NEXT_PUBLIC_API_WS_BASE_URL;
  else process.env.NEXT_PUBLIC_API_WS_BASE_URL = initialWs;
});

it('normaliza la barra final y deriva WebSocket', () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://shop.example.test/api/v1/';
  delete process.env.NEXT_PUBLIC_API_WS_BASE_URL;
  expect(getApiBaseUrl()).toBe('https://shop.example.test/api/v1');
  expect(getWebSocketBaseUrl()).toBe('wss://shop.example.test/api/v1');
});

it('rechaza una URL ausente, duplicada o con credenciales', () => {
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  expect(() => getApiBaseUrl()).toThrow(/required/);
  process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8000/api/v1/api/v1';
  expect(() => getApiBaseUrl()).toThrow(/exactly one/);
  process.env.NEXT_PUBLIC_API_BASE_URL = 'http://user:secret@localhost:8000/api/v1';
  expect(() => getApiBaseUrl()).toThrow(/credentials/);
});
