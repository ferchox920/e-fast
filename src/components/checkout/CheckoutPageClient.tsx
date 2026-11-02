'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { getOrCreateGuestToken } from '@/lib/guestToken';
import { useCreateOrGetCartMutation, useGetCartQuery } from '@/store/api/cartApi';
import { useCreateOrderFromCartMutation, useGetCheckoutQuoteQuery } from '@/store/api/ordersApi';
import { useCreatePaymentForOrderMutation } from '@/store/api/paymentsApi';
import { useAppSelector } from '@/store/hooks';
import { selectCart, selectCartItems } from '@/store/slices/cartSlice';
import type { PaymentRead, ShippingAddress, ShippingMethodCode } from '@/types/order';

type ShippingFormState = {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  notes: string;
};

const INITIAL_FORM: ShippingFormState = {
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'AR',
  phone: '',
  notes: '',
};

const REQUIRED_FIELDS: Array<keyof ShippingFormState> = [
  'address_line1',
  'city',
  'state',
  'postal_code',
  'country',
];

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (!error || typeof error !== 'object') {
    return 'No pudimos iniciar el checkout. Intenta nuevamente.';
  }

  if ('status' in error) {
    const fetchError = error as FetchBaseQueryError & { data?: unknown };
    const detail =
      fetchError.data &&
      typeof fetchError.data === 'object' &&
      'detail' in fetchError.data &&
      typeof fetchError.data.detail === 'string'
        ? fetchError.data.detail
        : null;

    if (detail) return detail;

    const statusCode = normalizeStatus(fetchError.status);
    if (statusCode === 401 || statusCode === 403) {
      return 'Tu sesion no tiene permisos para generar pagos.';
    }
    if (statusCode === 400) {
      return 'La orden no esta lista para pagar o no tiene items.';
    }
    if (statusCode === 404) {
      return 'No encontramos el carrito para completar el checkout.';
    }
    if (statusCode === 409) {
      return 'No pudimos completar la orden por una transicion invalida o stock insuficiente.';
    }
    if (statusCode === 422) {
      return 'Revisa los datos ingresados para continuar.';
    }
    if (statusCode !== null && statusCode >= 500) {
      return 'El servicio de pagos no esta disponible temporalmente.';
    }
  }

  return 'No pudimos iniciar el checkout. Intenta nuevamente.';
};

const formatCurrency = (value: number, currency = 'ARS') => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const isBlank = (value: string) => value.trim().length === 0;

const createIdempotencyKey = (orderId: string) => `checkout-payment:${orderId}`;

export default function CheckoutPageClient() {
  const [ensureCart] = useCreateOrGetCartMutation();
  const {
    error: cartError,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    refetch,
  } = useGetCartQuery();
  const [createOrderFromCart, createOrderState] = useCreateOrderFromCartMutation();
  const [createPaymentForOrder, createPaymentState] = useCreatePaymentForOrderMutation();

  const cart = useAppSelector(selectCart);
  const cartItems = useAppSelector(selectCartItems);

  const authStatus = useAppSelector((state) => state.user.status);
  const accessToken = useAppSelector((state) => state.user.session.accessToken);
  const scopes = useAppSelector((state) => state.user.session.scopes ?? []);
  const currentUser = useAppSelector((state) => state.user.current);

  const [form, setForm] = useState<ShippingFormState>(INITIAL_FORM);
  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<ShippingMethodCode>('standard');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentRead | null>(null);

  const hasEnsuredCart = useRef(false);

  useEffect(() => {
    if (hasEnsuredCart.current) return;
    hasEnsuredCart.current = true;
    ensureCart(undefined).catch(() => undefined);
  }, [ensureCart]);

  const isAuthenticated = Boolean(accessToken) && authStatus === 'authenticated';
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';
  const hasOrderWriteScope = !isAdminUser && scopes.includes('orders:write');
  const canUseGuestCheckout = !isAuthenticated;
  const canCreateCustomerOrder = isAuthenticated && hasOrderWriteScope;
  const isBusy =
    isCartLoading || isCartFetching || createOrderState.isLoading || createPaymentState.isLoading;

  const hasItems = cartItems.length > 0;

  const paymentUrl = useMemo(
    () => payment?.init_point ?? payment?.sandbox_init_point ?? null,
    [payment],
  );

  const shippingAddress = useMemo<ShippingAddress>(() => {
    const address: ShippingAddress = {
      address_line1: form.address_line1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim(),
    };
    const addressLine2 = form.address_line2.trim();
    const phone = form.phone.trim();
    if (addressLine2) address.address_line2 = addressLine2;
    if (phone) address.phone = phone;
    return address;
  }, [form]);

  const lineItemsTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + toNumber(item.line_total), 0),
    [cartItems],
  );

  const hasCompleteShippingAddress = REQUIRED_FIELDS.every((field) => !isBlank(form[field]));

  const checkoutQuoteInput = useMemo(
    () => ({
      currency: cart?.currency ?? 'ARS',
      lines: cartItems.map((item) => ({
        variant_id: String(item.variant_id),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
      })),
      shipping_method: selectedShippingMethod,
      applied_promotions: [],
      shipping_address: hasCompleteShippingAddress ? shippingAddress : null,
    }),
    [
      cart?.currency,
      cartItems,
      hasCompleteShippingAddress,
      selectedShippingMethod,
      shippingAddress,
    ],
  );

  const {
    data: checkoutQuote,
    error: checkoutQuoteError,
    isFetching: isCheckoutQuoteFetching,
  } = useGetCheckoutQuoteQuery(checkoutQuoteInput, {
    skip: !hasItems,
  });

  const handleChangeField = (field: keyof ShippingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    for (const field of REQUIRED_FIELDS) {
      if (isBlank(form[field])) {
        return 'Completa todos los campos obligatorios de envio.';
      }
    }
    return null;
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (isAdminUser) {
      setErrorMessage('Las cuentas administradoras no pueden generar pedidos de compra.');
      return;
    }
    if (isAuthenticated && !hasOrderWriteScope) {
      setErrorMessage('Tu sesion no tiene permisos para crear ordenes.');
      return;
    }
    if (!cart || !hasItems) {
      setErrorMessage('Tu carrito esta vacio. Agrega productos para continuar.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      const guestToken = canUseGuestCheckout ? getOrCreateGuestToken() : null;
      if (canUseGuestCheckout && !guestToken) {
        setErrorMessage('No pudimos preparar el token de invitado para crear la orden.');
        return;
      }

      const order = await createOrderFromCart({
        guestToken,
        shipping_method: selectedShippingMethod,
        applied_promotions: [],
        shipping_address: shippingAddress,
        notes: form.notes.trim() || null,
      }).unwrap();

      const nextOrderId = String(order.id);
      setCreatedOrderId(nextOrderId);

      const nextPayment = await createPaymentForOrder({
        orderId: nextOrderId,
        idempotencyKey: createIdempotencyKey(nextOrderId),
      }).unwrap();
      setPayment(nextPayment);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  const shippingCost = checkoutQuote?.shipping_amount ?? 0;
  const taxAmount = checkoutQuote?.tax_amount ?? 0;
  const discountAmount = checkoutQuote?.discount_amount ?? 0;
  const subtotalAmount = checkoutQuote?.subtotal_amount ?? lineItemsTotal;
  const finalTotal = checkoutQuote?.total_amount ?? lineItemsTotal;
  const currency = cart?.currency ?? 'ARS';
  const selectedShippingMethodLabel =
    checkoutQuote?.shipping_methods.find((method) => method.code === checkoutQuote.shipping_method)
      ?.name ??
    checkoutQuote?.shipping_method ??
    selectedShippingMethod;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8">
      <header className="space-y-2 border-b border-neutral-200 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Checkout</h1>
        <p className="text-sm text-neutral-600">
          Revisa tu pedido, confirma direccion de envio y continua al pago con Mercado Pago.
        </p>
      </header>

      {!isAuthenticated ? (
        <article className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
          <h2 className="text-base font-semibold">Checkout como invitado</h2>
          <p>
            Puedes crear la orden con tu carrito actual. Si ya tienes cuenta, inicia sesion para
            asociarla a tu historial.
          </p>
          <Link
            href="/login?redirect=/checkout"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Iniciar sesion
          </Link>
        </article>
      ) : null}
      {isAuthenticated && isAdminUser ? (
        <article className="space-y-4 rounded-2xl border border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-700">
          <h2 className="text-base font-semibold">Cuenta administrativa detectada</h2>
          <p>
            El checkout de tienda está deshabilitado para administradores. Gestiona pedidos desde el
            panel de administración.
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Ir a pedidos admin
          </Link>
        </article>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleCheckout}
          className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Direccion de envio</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-neutral-700 sm:col-span-2">
              <span>Direccion *</span>
              <input
                type="text"
                value={form.address_line1}
                onChange={(event) => handleChangeField('address_line1', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Calle y numero"
                required
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700 sm:col-span-2">
              <span>Referencia</span>
              <input
                type="text"
                value={form.address_line2}
                onChange={(event) => handleChangeField('address_line2', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Depto, piso, torre, etc."
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700">
              <span>Ciudad *</span>
              <input
                type="text"
                value={form.city}
                onChange={(event) => handleChangeField('city', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700">
              <span>Provincia / Estado *</span>
              <input
                type="text"
                value={form.state}
                onChange={(event) => handleChangeField('state', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700">
              <span>Codigo postal *</span>
              <input
                type="text"
                value={form.postal_code}
                onChange={(event) => handleChangeField('postal_code', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700">
              <span>Pais *</span>
              <input
                type="text"
                value={form.country}
                onChange={(event) => handleChangeField('country', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700 sm:col-span-2">
              <span>Telefono de contacto</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => handleChangeField('phone', event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <label className="space-y-1 text-sm text-neutral-700 sm:col-span-2">
              <span>Notas para el pedido</span>
              <textarea
                value={form.notes}
                onChange={(event) => handleChangeField('notes', event.target.value)}
                className="min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Indicaciones para envio o entrega"
              />
            </label>
          </div>

          {hasItems ? (
            <fieldset className="space-y-3 rounded-xl border border-neutral-200 p-4">
              <legend className="px-1 text-sm font-semibold text-neutral-900">
                Metodo de envio
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(checkoutQuote?.shipping_methods ?? []).map((method) => (
                  <label
                    key={method.code}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-3 text-sm transition hover:border-indigo-300"
                  >
                    <input
                      type="radio"
                      name="shipping_method"
                      value={method.code}
                      checked={selectedShippingMethod === method.code}
                      onChange={() => setSelectedShippingMethod(method.code)}
                      className="mt-1"
                    />
                    <span className="space-y-1">
                      <span className="block font-medium text-neutral-900">{method.name}</span>
                      <span className="block text-xs text-neutral-500">
                        {method.estimated_days_min}-{method.estimated_days_max} dias
                      </span>
                      <span className="block text-sm font-semibold text-neutral-900">
                        {formatCurrency(method.amount, currency)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {isCheckoutQuoteFetching ? (
                <p className="text-xs text-neutral-500">Calculando envio e impuestos...</p>
              ) : null}
              {checkoutQuoteError ? (
                <p className="text-xs text-red-600">
                  No pudimos cotizar envio e impuestos. Revisa los datos del pedido.
                </p>
              ) : null}
              {checkoutQuote ? (
                <dl className="grid gap-2 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-neutral-500">Metodo efectivo</dt>
                    <dd className="text-neutral-900">{selectedShippingMethodLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-neutral-500">Zona / peso</dt>
                    <dd className="text-neutral-900">
                      {checkoutQuote.shipping_zone ?? 'sin zona'} -{' '}
                      {checkoutQuote.shipping_weight_grams} g
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-neutral-500">Impuesto</dt>
                    <dd className="text-neutral-900">
                      {(checkoutQuote.tax_rate * 100).toFixed(2)}%
                    </dd>
                  </div>
                </dl>
              ) : null}
            </fieldset>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {payment ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Preferencia creada correctamente.</p>
              {createdOrderId ? <p>Orden: #{createdOrderId}</p> : null}
              {paymentUrl ? (
                <a
                  href={paymentUrl}
                  target="_self"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Pagar con Mercado Pago
                </a>
              ) : (
                <p>No encontramos URL de checkout en la respuesta de pago.</p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                isAdminUser ||
                (!canCreateCustomerOrder && !canUseGuestCheckout) ||
                !hasItems ||
                isBusy
              }
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {createOrderState.isLoading || createPaymentState.isLoading
                ? 'Procesando checkout...'
                : 'Generar pago'}
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Actualizar carrito
            </button>
          </div>
        </form>

        <aside className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Resumen final</h2>

          {isCartLoading || isCartFetching ? (
            <p className="text-sm text-neutral-500">Cargando carrito...</p>
          ) : cartError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              No pudimos cargar el carrito. Intenta nuevamente.
            </p>
          ) : !hasItems ? (
            <div className="space-y-2 text-sm text-neutral-600">
              <p>Tu carrito esta vacio.</p>
              <Link
                href="/products"
                className="inline-flex rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Ir a productos
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {cartItems.map((item) => (
                  <li
                    key={String(item.id)}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        Variante {String(item.variant_id)}
                      </p>
                      <p className="text-xs text-neutral-500">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-neutral-900">
                      {formatCurrency(toNumber(item.line_total), currency)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="space-y-2 border-t border-neutral-200 pt-3 text-sm">
                <div className="flex items-center justify-between text-neutral-600">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(subtotalAmount, currency)}</dd>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <dt>Descuentos</dt>
                  <dd>-{formatCurrency(discountAmount, currency)}</dd>
                </div>
                {checkoutQuote?.applied_promotions?.length ? (
                  <div className="flex items-center justify-between text-neutral-600">
                    <dt>Promociones</dt>
                    <dd>{checkoutQuote.applied_promotions.length}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-neutral-600">
                  <dt>Envio</dt>
                  <dd>{formatCurrency(shippingCost, currency)}</dd>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <dt>Impuestos</dt>
                  <dd>{formatCurrency(taxAmount, currency)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                  <dt>Total</dt>
                  <dd>{formatCurrency(finalTotal, currency)}</dd>
                </div>
              </dl>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
