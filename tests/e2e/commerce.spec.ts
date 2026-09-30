import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const api = 'http://127.0.0.1:59002/api/v1';
const provider = 'http://127.0.0.1:59001';
const control = { 'x-test-control': 'e2e-control-only' };

test('imagen local de fallback y variante agotada sin envío al carrito', async ({ page }) => {
  await page.goto('/products');
  const card = page.locator('a[href="/products/e2e-sin-imagen"]').first();
  await expect(card.locator('img')).toHaveAttribute('src', '/product-placeholder.svg');
  await card.click();
  await expect(
    page.getByText('Este producto no tiene imagenes disponibles.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Agregar al carrito', exact: true }),
  ).toBeDisabled();
});

async function login(page: Page, user = 'user1', redirect = '/products') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel('Email', { exact: true }).fill(`${user}.dev@example.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('UserDev123!');
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/auth/login') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  const result = await (await response).json();
  await expect(page).toHaveURL(new RegExp(redirect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  return result.access_token as string;
}
async function shop(page: Page, request: APIRequestContext) {
  const response = await request.get(`${api}/products?limit=100`);
  expect(response.ok()).toBeTruthy();
  const catalog = await response.json();
  const categories = await (await request.get(`${api}/categories`)).json();
  const product = catalog.items.find(
    (p: { category_id: string; variants: { stock_on_hand: number; stock_reserved: number }[] }) =>
      categories.some((c: { id: string }) => c.id === p.category_id) &&
      p.variants.some((v) => v.stock_on_hand - v.stock_reserved > 10),
  );
  expect(product).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Nuestro catálogo' })).toBeVisible();
  if (product.category_id) {
    await page
      .getByRole('combobox', { name: 'Categoria', exact: true })
      .selectOption(product.category_id);
    await expect(page.getByRole('combobox', { name: 'Categoria', exact: true })).toHaveValue(
      product.category_id,
    );
  }
  await page.locator(`a[href="/products/${product.slug}"]`).first().click();
  await expect(page.getByRole('heading', { name: product.title, exact: true })).toBeVisible();
  const variant = page.getByRole('combobox', { name: 'Talla', exact: true });
  if (await variant.count()) await variant.selectOption({ index: 0 });
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await expect(page.getByText('Producto agregado al carrito.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Abrir carrito/ }).click();
  await page.getByRole('link', { name: 'Ver carrito', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Carrito', exact: true })).toBeVisible();
  return product;
}
async function createOrder(page: Page) {
  let count = 0;
  const listener = (r: { url(): string; method(): string }) => {
    if (r.url().endsWith('/orders/from-cart') && r.method() === 'POST') count++;
  };
  page.on('request', listener);
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/orders/from-cart') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Crear pedido', exact: true }).click({ clickCount: 2 });
  const result = await (await response).json();
  expect(result.id).toBeTruthy();
  expect(result.total_amount).toBe(
    result.subtotal_amount - result.discount_amount + result.shipping_amount + result.tax_amount,
  );
  expect(count).toBe(1);
  page.off('request', listener);
  return result;
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:'))
      errors.push(message.text());
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname))
      errors.push(`Unexpected external request: ${url.origin}`);
  });
  await test
    .info()
    .attach('runtime-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  (page as Page & { runtimeErrors: string[] }).runtimeErrors = errors;
});
test.afterEach(async ({ page }) => {
  const errors = (page as Page & { runtimeErrors: string[] }).runtimeErrors;
  await test.info().attach('runtime-errors-final', {
    body: JSON.stringify(errors),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await test.info().attach('final-page', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

test('login inválido, teclado, categoría, variante y edición completa del carrito', async ({
  page,
  request,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('user1.dev@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('wrong-password');
  await page.getByLabel('Contraseña', { exact: true }).press('Enter');
  await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible();
  await login(page);
  const searchButton = page.getByRole('button', { name: 'Abrir buscador' });
  await searchButton.focus();
  await searchButton.press('Enter');
  await expect(
    page.getByRole('searchbox', { name: 'Buscar productos', exact: true }),
  ).toBeFocused();
  await page.getByRole('searchbox', { name: 'Buscar productos', exact: true }).press('Escape');
  await expect(searchButton).toBeFocused();
  await searchButton.press('Enter');
  await page
    .getByRole('searchbox', { name: 'Buscar productos', exact: true })
    .fill('inexistente-e2e');
  await page.getByRole('searchbox', { name: 'Buscar productos', exact: true }).press('Enter');
  await expect(page).toHaveURL('/products?search=inexistente-e2e');
  await expect(page.getByText('No encontramos productos', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await shop(page, request);
  await page.getByRole('button', { name: 'Aumentar cantidad de artículo 1', exact: true }).click();
  await expect(page.locator('main li').first()).toContainText('2');
  await page.getByRole('button', { name: 'Reducir cantidad de artículo 1', exact: true }).click();
  await expect(page.locator('main li').first()).toContainText('1');
  await page.getByRole('button', { name: 'Quitar', exact: true }).click();
  await expect(page.getByText('Tu carrito está vacío.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Explorar productos' }).click();
  await shop(page, request);
  const order = await createOrder(page);
  await expect(page).toHaveURL(`/orders/${order.id}`);
  await expect(page.getByText('Pago pendiente', { exact: true })).toBeVisible();
});

for (const status of ['pending', 'approved', 'rejected'] as const) {
  test(`pago ${status}, webhook firmado y efectos idempotentes`, async ({ page, request }) => {
    const token = await login(page);
    const product = await shop(page, request);
    const order = await createOrder(page);
    const headers = { authorization: `Bearer ${token}` };
    const preferenceResponse = page.waitForResponse((r) =>
      r.url().endsWith(`/payments/orders/${order.id}`),
    );
    await page.getByRole('button', { name: 'Preparar pago', exact: true }).click({ clickCount: 2 });
    const payment = await (await preferenceResponse).json();
    expect(payment.id).toBeTruthy();
    await page.getByRole('button', { name: 'Preparar pago', exact: true }).click();
    const current = await (await request.get(`${api}/orders/${order.id}`, { headers })).json();
    expect(current.payments).toHaveLength(1);
    expect(current.payment_status).toBe('pending');
    await page.getByRole('link', { name: 'Continuar al proveedor de pago' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout local de pruebas' })).toBeVisible();
    await page
      .getByRole('button', {
        name:
          status === 'approved'
            ? 'Aprobar pago'
            : status === 'rejected'
              ? 'Rechazar pago'
              : 'Mantener pendiente',
      })
      .click();
    const state = await (
      await request.get(`${provider}/__control/state`, { headers: control })
    ).json();
    const record = state.find(
      (r: { payment: { external_reference: string } }) => r.payment.external_reference === order.id,
    );
    expect(record.events).toContainEqual({ status: 'processed' });
    const variantId = order.lines[0].variant_id;
    const stockAfter = await (await request.get(`${api}/products/${product.id}/variants`)).json();
    const orderAfter = await (await request.get(`${api}/orders/${order.id}`, { headers })).json();
    const duplicate = await request.post(`${provider}/__control/emit`, {
      headers: control,
      data: { preferenceId: record.preference.id, eventId: `${record.payment.id}-${status}` },
    });
    expect(await duplicate.json()).toEqual({ status: 'duplicate' });
    const repeated = await (await request.get(`${api}/orders/${order.id}`, { headers })).json();
    expect(repeated.payments).toHaveLength(1);
    expect(repeated.payment_status).toBe(status);
    expect(repeated.paid_at).toBe(orderAfter.paid_at);
    expect(repeated.total_amount).toBe(orderAfter.total_amount);
    const stockRepeated = await (
      await request.get(`${api}/products/${product.id}/variants`)
    ).json();
    expect(stockRepeated.find((v: { id: string }) => v.id === variantId)).toEqual(
      stockAfter.find((v: { id: string }) => v.id === variantId),
    );
    await page.getByRole('link', { name: 'Volver al comercio' }).click();
    await expect(
      page.getByText('Tu sesión terminó al salir del comercio.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Ingresar y consultar pedido' }).click();
    await page.getByLabel('Email', { exact: true }).fill('user1.dev@example.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('UserDev123!');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    const label =
      status === 'approved'
        ? 'Pago aprobado'
        : status === 'rejected'
          ? 'Pago rechazado'
          : 'Pago pendiente';
    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Ingresa para consultar el pedido.')).toBeVisible();
    await login(page, 'user1', `/orders/${order.id}`);
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  });
}

test('deniega un pedido ajeno desde la interfaz', async ({ page, request, browser }) => {
  await login(page);
  await shop(page, request);
  const order = await createOrder(page);
  const other = await browser.newContext({ baseURL: 'http://127.0.0.1:59000' });
  const otherPage = await other.newPage();
  await login(otherPage, 'user2', `/orders/${order.id}`);
  await expect(otherPage.locator('main').getByRole('alert')).toContainText(
    'No encontramos el recurso solicitado.',
  );
  await other.close();
});

test('invitado conserva confirmación y no ofrece consulta sin sesión', async ({
  page,
  request,
}) => {
  await page.goto('/products');
  await shop(page, request);
  const order = await createOrder(page);
  expect(order.user_id).toBeNull();
  await expect(page.getByText(`Pedido invitado creado: ${order.id}`)).toBeVisible();
  await expect(page.getByText('Tu carrito está vacío.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Pedido invitado creado: ${order.id}`)).toBeVisible();
  await expect(page.getByText('Tu carrito está vacío.', { exact: false })).toBeVisible();
  expect((await request.get(`${api}/orders/${order.id}`)).status()).toBe(401);
  await page.goto(`/orders/${order.id}`);
  await expect(page.getByText('Ingresa para consultar el pedido.')).toBeVisible();
});
