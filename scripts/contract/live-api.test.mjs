import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.CONTRACT_API_BASE_URL;
assert.ok(base, 'CONTRACT_API_BASE_URL is required');
assert.match(base, /^https?:\/\/[^/]+\/api\/v1$/);

async function request(path, { token, method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

async function login(email, password = 'UserDev123!') {
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.ok(data.access_token);
  assert.ok(data.refresh_token);
  assert.ok(data.user?.id);
  return data;
}

async function websocketOutcome(token) {
  const url = new URL(`${base.replace(/^http/, 'ws')}/notifications/ws`);
  if (token) url.searchParams.set('token', token);
  const socket = new WebSocket(url);
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('WebSocket handshake timed out'));
    }, 5000);
    socket.addEventListener('open', () => {
      if (token) {
        clearTimeout(timeout);
        socket.close(1000);
        resolve({ opened: true });
      }
    });
    socket.addEventListener('close', (event) => {
      clearTimeout(timeout);
      if (!token) resolve({ opened: false, code: event.code });
    });
    socket.addEventListener('error', (event) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket handshake failed: ${event.message ?? 'unknown error'}`));
    });
  });
}

test('contrato HTTP real: login, catálogo, carrito, pedido, propiedad y notificaciones', async () => {
  const first = await login('user1.dev@example.com');
  assert.deepEqual(await websocketOutcome(first.access_token), { opened: true });
  assert.deepEqual(await websocketOutcome(), { opened: false, code: 4401 });
  const second = await login('user2.dev@example.com');
  const admin = await login('admin.dev@example.com', 'AdminDev123!');
  const deniedAdmin = await request('/admin/users', { token: first.access_token });
  assert.equal(deniedAdmin.status, 403);
  const allowedAdmin = await request('/admin/users', { token: admin.access_token });
  assert.equal(allowedAdmin.status, 200);
  assert.ok(Array.isArray(allowedAdmin.data));

  const catalog = await request('/products?page=1&limit=20');
  assert.equal(catalog.status, 200);
  assert.ok(catalog.data.items.length > 0);
  assert.equal(typeof catalog.data.total, 'number');

  const product = catalog.data.items.find((item) =>
    item.variants?.some((v) => v.stock_on_hand - v.stock_reserved > 1),
  );
  assert.ok(product, 'seed must provide an in-stock variant');
  const detail = await request(`/products/${encodeURIComponent(product.slug)}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.id, product.id);
  const variants = await request(`/products/${product.id}/variants`);
  assert.equal(variants.status, 200);
  const variant = variants.data.find((item) => item.stock_on_hand - item.stock_reserved > 1);
  assert.ok(variant);

  const cart = await request('/cart', {
    token: first.access_token,
    method: 'POST',
    body: { currency: 'ARS' },
  });
  assert.ok([200, 201].includes(cart.status));
  for (const item of cart.data.items) {
    const removed = await request(`/cart/items/${item.id}`, {
      token: first.access_token,
      method: 'DELETE',
    });
    assert.equal(removed.status, 200);
  }
  const added = await request('/cart/items', {
    token: first.access_token,
    method: 'POST',
    body: { variant_id: variant.id, quantity: 1 },
  });
  assert.equal(added.status, 201, JSON.stringify(added.data));
  assert.ok(added.data.items.some((item) => item.variant_id === variant.id));

  const order = await request('/orders/from-cart', {
    token: first.access_token,
    method: 'POST',
    body: {},
  });
  assert.equal(order.status, 201, JSON.stringify(order.data));
  assert.equal(order.data.user_id, first.user.id);
  assert.ok(order.data.total_amount > 0);
  const own = await request(`/orders/${order.data.id}`, { token: first.access_token });
  assert.equal(own.status, 200);
  const foreign = await request(`/orders/${order.data.id}`, { token: second.access_token });
  assert.equal(foreign.status, 404);

  const notifications = await request('/notifications?limit=50&offset=0', {
    token: first.access_token,
  });
  assert.equal(notifications.status, 200);
  assert.ok(Array.isArray(notifications.data));
  if (notifications.data.length) {
    const item = notifications.data[0];
    assert.equal(item.user_id, first.user.id);
    const marked = await request(`/notifications/${item.id}`, {
      token: first.access_token,
      method: 'PATCH',
      body: { is_read: true },
    });
    assert.equal(marked.status, 200);
    assert.equal(marked.data.is_read, true);
  }

  const guestToken = randomUUID();
  const guest = await request('/cart', {
    method: 'POST',
    body: { guest_token: guestToken, currency: 'ARS' },
  });
  assert.equal(guest.status, 201);
  assert.equal(guest.data.guest_token, guestToken);
  const possessed = await request(`/cart?guest_token=${guestToken}`);
  assert.equal(possessed.status, 200);
  const unpossessed = await request('/cart');
  assert.equal(unpossessed.status, 400);
  const guestItem = await request(`/cart/items?guest_token=${guestToken}`, {
    method: 'POST',
    body: { variant_id: variant.id, quantity: 1 },
  });
  assert.equal(guestItem.status, 201);
  const guestOrder = await request('/orders/from-cart', {
    method: 'POST',
    body: { guest_token: guestToken },
  });
  assert.equal(guestOrder.status, 201, JSON.stringify(guestOrder.data));
  assert.equal(guestOrder.data.user_id, null);
  const guestOrderRead = await request(`/orders/${guestOrder.data.id}`);
  assert.equal(guestOrderRead.status, 401);
});
