const API_SUFFIX = '/api/v1';

export function isAllowedWebSocketTransport(url: URL, pageHostname: string): boolean {
  const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
  return (
    url.protocol === 'wss:' ||
    (url.protocol === 'ws:' && loopback.has(url.hostname) && loopback.has(pageHostname))
  );
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is required (for example http://localhost:8000/api/v1)',
    );
  }
  const url = new URL(configured);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must use http or https');
  }
  const path = url.pathname.replace(/\/+$/, '');
  if (path !== API_SUFFIX) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must end in exactly one /api/v1');
  }
  if (url.search || url.hash || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must not contain credentials, query or fragment');
  }
  return `${url.origin}${API_SUFFIX}`;
}

export function getWebSocketBaseUrl(): string {
  const httpBase = new URL(getApiBaseUrl());
  const configured = process.env.NEXT_PUBLIC_API_WS_BASE_URL?.trim();
  const url = configured ? new URL(configured) : new URL(httpBase.toString());
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('WebSocket URL must use ws or wss');
  }
  if (httpBase.protocol === 'https:' && url.protocol !== 'wss:') {
    throw new Error('Secure HTTP requires wss');
  }
  if (
    url.pathname.replace(/\/+$/, '') !== API_SUFFIX ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error('WebSocket base URL must end in exactly one /api/v1');
  }
  return `${url.protocol}//${url.host}${API_SUFFIX}`;
}
