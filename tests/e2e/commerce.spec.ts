import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { monitorContext } from '../../scripts/e2e/runtime.mjs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const api = 'http://127.0.0.1:59002/api/v1';
const provider = 'http://127.0.0.1:59001';
const control = { 'x-test-control': 'e2e-control-only' };

async function capture(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

test('imagen local de fallback y variante agotada sin envío al carrito', async ({ page }) => {
  await page.goto('/products');
  const card = page.locator('a[href="/products/e2e-sin-imagen"]').first();
  await expect(card.locator('img')).toHaveAttribute('src', '/product-placeholder.svg');
  const article = card.locator('xpath=..');
  await expect(article.getByText('Agotado', { exact: true })).toBeVisible();
  await expect(article.getByRole('button', { name: 'Agregar', exact: true })).toBeDisabled();
  await card.click();
  await expect(
    page.getByText('Este producto no tiene imagenes disponibles.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Agregar al carrito', exact: true }),
  ).toBeDisabled();
  await expect(page.getByText('Agotado', { exact: true })).toBeVisible();
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
async function shop(page: Page, request: APIRequestContext, slug?: string) {
  const response = await request.get(`${api}/products?limit=100`);
  expect(response.ok()).toBeTruthy();
  const catalog = await response.json();
  const categories = await (await request.get(`${api}/categories`)).json();
  const product = catalog.items.find(
    (p: { category_id: string; variants: { stock_on_hand: number; stock_reserved: number }[] }) =>
      (slug
        ? (p as { slug?: string }).slug === slug
        : !(p as { slug?: string }).slug?.startsWith('e2e-')) &&
      categories.some((c: { id: string }) => c.id === p.category_id) &&
      p.variants.some((v) => v.stock_on_hand - v.stock_reserved > 10),
  );
  expect(product).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Nuestro catálogo' })).toBeVisible();
  await capture(page, 'catalog');
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
  await capture(page, 'variant-detail');
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await expect(page.getByText('Producto agregado al carrito.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Abrir carrito/ }).click();
  await page.getByRole('link', { name: 'Ver carrito', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Carrito', exact: true })).toBeVisible();
  await capture(page, 'cart');
  return product;
}

async function adminHeaders(request: APIRequestContext) {
  const response = await request.post(`${api}/auth/login`, {
    form: { username: 'admin.dev@example.com', password: 'AdminDev123!' },
  });
  expect(response.status()).toBe(200);
  return { authorization: `Bearer ${(await response.json()).access_token}` };
}

async function inventoryEvidence(
  request: APIRequestContext,
  productId: string,
  order: { id: string; lines: { variant_id: string; quantity: number }[] },
  headers: { authorization: string },
) {
  const variants = await (await request.get(`${api}/products/${productId}/variants`)).json();
  const result = [];
  for (const line of order.lines) {
    const movementResponse = await request.get(
      `${api}/products/variants/${line.variant_id}/stock/movements?limit=200`,
      { headers },
    );
    expect(movementResponse.status()).toBe(200);
    result.push({
      quantity: line.quantity,
      variant: variants.find((v: { id: string }) => v.id === line.variant_id),
      movements: (await movementResponse.json()).filter(
        (m: { reason: string }) => m.reason === `order:${order.id}`,
      ),
    });
  }
  return result;
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

const monitors = new Map<Page, ReturnType<typeof monitorContext>>();
test.beforeEach(async ({ page, context }) => {
  const errors: string[] = [];
  monitors.set(
    page,
    monitorContext(context, errors, [{ method: 'GET', path: '/api/v1/cart', status: 404 }]),
  );
  await test
    .info()
    .attach('runtime-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  (page as Page & { runtimeErrors: string[] }).runtimeErrors = errors;
});
test.afterEach(async ({ page }) => {
  monitors.get(page)?.finish();
  monitors.delete(page);
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
  monitors.get(page)?.allow({ method: 'POST', path: '/api/v1/auth/login', status: 400 });
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

for (const { status, adjustment } of [
  { status: 'pending', adjustment: 'none' },
  { status: 'approved', adjustment: 'none' },
  { status: 'rejected', adjustment: 'none' },
  { status: 'approved', adjustment: 'discount' },
  { status: 'approved', adjustment: 'charges' },
  { status: 'approved', adjustment: 'combined' },
  { status: 'approved', adjustment: 'rounding' },
]) {
  test(`pago ${status} ${adjustment}, webhook firmado y efectos idempotentes`, async ({
    page,
    request,
  }) => {
    const token = await login(page);
    const admin = await adminHeaders(request);
    const product = await shop(
      page,
      request,
      adjustment === 'rounding' ? 'e2e-centavos' : undefined,
    );
    if (adjustment === 'rounding') {
      await page
        .getByRole('button', { name: 'Aumentar cantidad de artículo 1', exact: true })
        .click();
      await expect(page.locator('main li').first()).toContainText('2');
      await page
        .getByRole('button', { name: 'Aumentar cantidad de artículo 1', exact: true })
        .click();
      await expect(page.locator('main li').first()).toContainText('3');
    }
    if (['discount', 'combined', 'rounding'].includes(adjustment)) {
      const name = `Descuento E2E ${Date.now()}`;
      const promo = await request.post(`${api}/admin/promotions`, {
        headers: admin,
        data: {
          name,
          type: 'product',
          scope: 'product',
          criteria: { product_ids: [product.id] },
          benefits: { discount_percent: 10 },
          start_at: new Date(Date.now() - 60000).toISOString(),
          end_at: new Date(Date.now() + 3600000).toISOString(),
        },
      });
      expect(promo.status()).toBe(201);
      const id = (await promo.json()).id;
      expect(
        (await request.post(`${api}/admin/promotions/${id}/activate`, { headers: admin })).status(),
      ).toBe(200);
      const loaded = page.waitForResponse((r) => r.url().endsWith('/promotions/active'));
      await page.getByRole('link', { name: 'MyApp', exact: true }).click();
      await page.getByRole('button', { name: /^Abrir carrito/ }).click();
      await page.getByRole('link', { name: 'Ver carrito', exact: true }).click();
      await loaded;
      await page.getByRole('combobox', { name: 'Promoción', exact: true }).selectOption(id);
    }
    let order = await createOrder(page);
    const headers = { authorization: `Bearer ${token}` };
    if (['charges', 'combined', 'rounding'].includes(adjustment)) {
      const backend = resolve(process.env.E2E_BACKEND_DIR ?? '');
      const python =
        process.env.E2E_PYTHON ??
        join(backend, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
      execFileSync(python, [resolve('scripts/e2e/adjust-order.py'), order.id, adjustment], {
        cwd: backend,
        env: process.env,
        timeout: 15000,
      });
      order = await (await request.get(`${api}/orders/${order.id}`, { headers })).json();
      await page.getByRole('button', { name: 'Actualizar estado', exact: true }).click();
    }
    if (['discount', 'combined', 'rounding'].includes(adjustment))
      expect(order.discount_amount).toBeGreaterThan(0);
    if (adjustment === 'rounding') expect(order.total_amount).toBe(0.91);
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
    expect(current.paid_at).toBeNull();
    expect(current.payments[0].amount).toBe(order.total_amount);
    expect(current.payments[0].currency).toBe(order.currency);
    const before = await inventoryEvidence(request, product.id, order, admin);
    for (const entry of before) {
      expect(entry.variant.stock_reserved).toBeGreaterThanOrEqual(entry.quantity);
      expect(entry.movements.filter((m: { type: string }) => m.type === 'reserve')).toHaveLength(1);
      expect(entry.movements.some((m: { type: string }) => m.type === 'sale')).toBe(false);
    }
    const providerState = await (
      await request.get(`${provider}/__control/state`, { headers: control })
    ).json();
    const originalRecord = providerState.find(
      (r: { payment: { external_reference: string } }) => r.payment.external_reference === order.id,
    );
    expect(originalRecord.payment.transaction_amount).toBe(order.total_amount);
    expect(originalRecord.payment.currency_id).toBe(order.currency);
    if (adjustment === 'combined') {
      for (const wrong of [
        { transaction_amount: order.total_amount + 0.01 },
        { currency_id: 'USD' },
      ]) {
        await request.post(`${provider}/__control/payment`, {
          headers: control,
          data: { preferenceId: originalRecord.preference.id, status: 'approved', ...wrong },
        });
        const rejected = await request.post(`${provider}/__control/emit`, {
          headers: control,
          data: {
            preferenceId: originalRecord.preference.id,
            eventId: `wrong-${Object.keys(wrong)[0]}-${order.id}`,
            expectedStatus: 409,
          },
        });
        expect((await rejected.json()).httpStatus).toBe(409);
        expect(await inventoryEvidence(request, product.id, order, admin)).toEqual(before);
        const stillPending = await (
          await request.get(`${api}/orders/${order.id}`, { headers })
        ).json();
        expect(stillPending.payment_status).toBe('pending');
        expect(stillPending.paid_at).toBeNull();
        await request.post(`${provider}/__control/payment`, {
          headers: control,
          data: { preferenceId: originalRecord.preference.id, ...originalRecord.payment },
        });
      }
    }
    await page.getByRole('link', { name: 'Continuar al proveedor de pago' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout local de pruebas' })).toBeVisible();
    await capture(page, 'local-provider');
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
    const after = await inventoryEvidence(request, product.id, order, admin);
    expect(orderAfter.payments).toHaveLength(1);
    expect(orderAfter.payments[0].status).toBe(status);
    expect(orderAfter.payments[0].amount).toBe(order.total_amount);
    expect(orderAfter.payments[0].currency).toBe(order.currency);
    if (status === 'approved') {
      expect(orderAfter.status).toBe('paid');
      expect(orderAfter.paid_at).toBeTruthy();
      for (const [index, entry] of after.entries()) {
        expect(entry.variant.stock_on_hand).toBe(
          before[index].variant.stock_on_hand - entry.quantity,
        );
        expect(entry.variant.stock_reserved).toBe(
          before[index].variant.stock_reserved - entry.quantity,
        );
        const sales = entry.movements.filter((m: { type: string }) => m.type === 'sale');
        expect(sales).toHaveLength(1);
        expect(sales[0].quantity).toBe(entry.quantity);
        expect(entry.movements).toHaveLength(before[index].movements.length + 1);
      }
    } else {
      expect(orderAfter.status).toBe(current.status);
      expect(orderAfter.paid_at).toBeNull();
      expect(after).toEqual(before);
    }
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
    const replayInventory = await inventoryEvidence(request, product.id, order, admin);
    expect(replayInventory).toEqual(after);
    await test.info().attach('payment-inventory-evidence', {
      body: JSON.stringify(
        {
          status,
          adjustment,
          orderBefore: current,
          orderAfter,
          orderReplay: repeated,
          providerPayload: originalRecord.payload,
          providerPayment: record.payment,
          before,
          after,
          replayInventory,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
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
    await capture(page, 'return-session');
    await page.getByRole('link', { name: 'Ingresar y consultar pedido' }).click();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await capture(page, 'return-login');
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
  const otherMonitor = monitorContext(
    other,
    (page as Page & { runtimeErrors: string[] }).runtimeErrors,
    [
      { method: 'GET', path: '/api/v1/cart', status: 404 },
      { method: 'GET', path: `/api/v1/orders/${order.id}`, status: 404 },
    ],
  );
  const otherPage = await other.newPage();
  await login(otherPage, 'user2', `/orders/${order.id}`);
  await expect(otherPage.locator('main').getByRole('alert')).toContainText(
    'No encontramos el recurso solicitado.',
  );
  await capture(otherPage, 'foreign-order-denied');
  await other.close();
  otherMonitor.finish();
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
  await capture(page, 'guest-confirmation');
  await page.reload();
  await expect(page.getByText(`Pedido invitado creado: ${order.id}`)).toBeVisible();
  await expect(page.getByText('Tu carrito está vacío.', { exact: false })).toBeVisible();
  expect((await request.get(`${api}/orders/${order.id}`)).status()).toBe(401);
  await page.goto(`/orders/${order.id}`);
  await expect(page.getByText('Ingresa para consultar el pedido.')).toBeVisible();
});
