import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { baseApi } from '../baseApi';
import { cartApi } from '../cartApi';
import { ordersApi } from '../ordersApi';
import { paymentsApi } from '../paymentsApi';
import { rootReducer } from '@/store/rootReducer';
import { server } from '@/test-utils/msw/server';

const base = 'http://localhost:8000/api/v1';
const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

describe('DTO comerciales contra el backend fijado', () => {
  it('envía el token de posesión del carrito invitado', async () => {
    server.use(
      http.post(`${base}/cart`, async ({ request }) => {
        expect(await request.json()).toEqual({ guest_token: 'guest-opaque', currency: 'ARS' });
        return HttpResponse.json(
          { id: 'cart', items: [], status: 'active', currency: 'ARS' },
          { status: 201 },
        );
      }),
    );
    const store = makeStore();
    await store
      .dispatch(cartApi.endpoints.createOrGetCart.initiate({ guestToken: 'guest-opaque' }))
      .unwrap();
  });

  it('envía promotion_id al crear el pedido desde el carrito', async () => {
    server.use(
      http.post(`${base}/orders/from-cart`, async ({ request }) => {
        expect(await request.json()).toEqual({
          guest_token: 'guest-opaque',
          promotion_id: 'promo-uuid',
        });
        return HttpResponse.json(
          { id: 'order-uuid', lines: [], payments: [], shipments: [] },
          { status: 201 },
        );
      }),
    );
    const store = makeStore();
    await store
      .dispatch(
        ordersApi.endpoints.createOrderFromCart.initiate({
          guest_token: 'guest-opaque',
          promotion_id: 'promo-uuid',
        }),
      )
      .unwrap();
  });

  it('envía una clave idempotente al crear la preferencia', async () => {
    server.use(
      http.post(`${base}/payments/orders/:orderId`, ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('stable-key');
        return HttpResponse.json(
          { id: 'payment-uuid', amount: 100, currency: 'ARS', status: 'pending' },
          { status: 201 },
        );
      }),
    );
    const store = makeStore();
    await store
      .dispatch(
        paymentsApi.endpoints.createPaymentForOrder.initiate({
          orderId: 'order-uuid',
          idempotencyKey: 'stable-key',
        }),
      )
      .unwrap();
  });

  it('conserva denegación del backend para una preferencia ajena', async () => {
    server.use(
      http.post(`${base}/payments/orders/:orderId`, () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
      ),
    );
    const store = makeStore();
    await expect(
      store
        .dispatch(
          paymentsApi.endpoints.createPaymentForOrder.initiate({
            orderId: 'foreign',
            idempotencyKey: 'stable-key',
          }),
        )
        .unwrap(),
    ).rejects.toMatchObject({ status: 403 });
  });
});
