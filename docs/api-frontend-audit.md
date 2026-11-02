# Auditoria API y mapa de integracion frontend

Fecha: 2026-04-24

Backend auditado: `D:\fast_api`
Frontend integrado: `D:\app-ecommerce\my-app`
Base URL configurada: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1`

## 1. Estado de la API

La API cubre los dominios principales de un ecommerce: autenticacion, usuarios, productos, categorias, marcas, carrito, ordenes, pagos, promociones, wishlist, loyalty, notificaciones, analytics, compras y reportes.

### Listos para integracion directa

| Dominio | Endpoints | Uso frontend |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/oauth/config`, `POST /auth/oauth/exchange`, `POST /auth/verify/request`, `GET /auth/verify/confirm` | Login, refresh JWT, OAuth y verificacion |
| Usuarios | `POST /users`, `GET /users/me`, `PUT /users/me` | Registro y cuenta |
| Productos | `GET /products`, `GET /products/{slug}`, `GET /products/{product_id}/variants` | Catalogo, detalle, variantes |
| Categorias/marcas | `GET /categories`, `GET /brands`, `GET/POST/PUT/DELETE /admin/categories` | Filtros publicos y administracion de catalogo |
| Carrito | `POST /cart`, `GET /cart`, `POST /cart/merge`, `POST /cart/items`, `PUT /cart/items/{item_id}`, `DELETE /cart/items/{item_id}` | Carrito invitado, autenticado y migracion post-login |
| Ordenes | `GET /orders`, `POST /orders/checkout-quote`, `POST /orders`, `GET /orders/{order_id}`, `POST /orders/{order_id}/cancel` | Checkout, historial y detalle |
| Pagos | `POST /payments/orders/{order_id}` | Preferencia Mercado Pago |
| Estado checkout | `GET /payments/orders/{order_id}/checkout-status` | Retorno de pago y resumen de orden/pago |
| Promociones | `GET /promotions/active`, `GET /promotions/{promotion_id}`, `GET /promotions/{promotion_id}/eligibility` | Landing/promos |
| Wishlist | `GET /wishes`, `POST /wishes`, `DELETE /wishes/{wish_id}` | Lista de deseos |
| Notificaciones | `GET /notifications`, `PATCH /notifications/{notification_id}`, `WS /notifications/ws` | Centro de notificaciones |

### Incompletos o con limitaciones

| Dominio | Endpoint | Limitacion |
|---|---|---|
| Checkout desde carrito | `POST /orders/from-cart` | Ya acepta `shipping_address`, `notes`, metodo de envio, descuento y promociones aplicadas. Envio e impuestos se calculan server-side. |
| Logout/sesiones | `POST /auth/logout` | Revoca refresh token via blacklist; en `ENVIRONMENT=production|staging` la API exige `REDIS_URL` y falla al arrancar si falta. |
| Recuperacion de password | `POST /auth/password/reset/request`, `POST /auth/password/reset/confirm` | Flujo implementado con token temporal y pantalla `/recuperar`. |
| Stock publico | Stock via variantes dentro del producto | No hay endpoint dedicado publico para disponibilidad por variante; se usa `variants` incluido en producto. |
| Pagos anonimos | `POST /payments/orders/{order_id}` requiere usuario | El pago real requiere login; checkout invitado solo puede armar carrito, no pagar. |
| Shipping | `POST /orders/checkout-quote`, `ShippingAddress`, `ProductVariant.weight_grams` | Direccion tipada y cotizacion server-side por zona, proveedor y peso; impuestos y total calculados en backend. |

### Faltantes para ecommerce productivo completo

- Estados de disponibilidad publica por SKU con reserva atomica visible.
- Checkout anonimo o decision explicita de negocio que obligue login antes de pagar.

## 2. Contratos usados por el frontend

### Auth

`POST /auth/login`

- Request: `application/x-www-form-urlencoded` con `username`, `password`.
- Response: `{ access_token, refresh_token, token_type, expires_in, user }`.
- Errores esperados: `400` credenciales invalidas, `422` body invalido.

`POST /auth/refresh`

- Request: `{ refresh_token: string }`.
- Response: `{ access_token, token_type, expires_in }`.
- Errores esperados: `401` refresh invalido.

`POST /auth/logout`

- Request: `{ refresh_token: string }`.
- Response: `204 No Content`.
- Efecto: revoca el refresh token por `jti`; luego `/auth/refresh` responde `401`.
- Errores esperados: `401` refresh invalido.

`POST /auth/password/reset/request`

- Request: `{ email: string }`.
- Response: `204 No Content`.
- Seguridad: respuesta silenciosa aunque el email no exista.

`POST /auth/password/reset/confirm`

- Request: `{ token: string, new_password: string }`.
- Response: `204 No Content`.
- Efecto: actualiza `hashed_password` y revoca el token de reset para impedir reutilizacion.
- Errores esperados: `400` token invalido/expirado/reutilizado, `404` usuario inexistente, `422` password invalida.

`POST /users`

- Request: `{ email, password, full_name?, address_line1?, city?, state?, postal_code?, country?, phone? }`.
- Response: `UserRead`.
- Errores esperados: `400` email existente, `422` validacion.

### Productos

`GET /products`

- Params: `search?`, `category?`, `brand?`, `min_price?`, `max_price?`, `page=1`, `page_size=20`.
- Compatibilidad: tambien acepta `limit`/`offset` para clientes legacy.
- Response: `{ total, page, pages, page_size, limit, items: ProductRead[] }`; `limit` queda como alias legacy de `page_size`.
- Errores esperados: `422` params invalidos.

### Categorias

`GET /categories`

- Uso: listado publico de categorias activas para filtros y navegacion.
- Response: `CategoryRead[]`.
- Errores esperados: ninguno especifico fuera de errores de servicio.

`GET /admin/categories`, `POST /admin/categories`, `PUT /admin/categories/{category_id}`, `DELETE /admin/categories/{category_id}`

- Uso: contrato canonico para administracion de categorias.
- Auth: admin.
- Compatibilidad: `GET /categories/all`, `POST /categories`, `PUT /categories/{category_id}` y `DELETE /categories/{category_id}` siguen disponibles como rutas legacy deprecadas en OpenAPI.

`GET /products/{slug}`

- Params path: `slug`; acepta fallback UUID si se envia `product_id`.
- Response: `ProductRead` con `variants` e `images`.
- Errores esperados: `404` producto inexistente/inactivo.

`GET /products/{product_id}/variants`

- Response: `ProductVariantRead[]`.
- Errores esperados: `404`, `422`.

### Carrito

`POST /cart`

- Request: `{ guest_token?: string | null, currency?: "ARS" }`.
- Response: `CartRead`.
- Errores esperados: `400` si carrito anonimo no tiene `guest_token`, `422`.

`GET /cart`

- Params: `guest_token?` para invitado.
- Response: `CartRead`.
- Errores esperados: `400` invitado sin token, `404` carrito no encontrado.

`POST /cart/items`

- Params: `guest_token?`.
- Request: `{ variant_id: UUID, quantity: number }`.
- Response: `CartRead`.
- Errores esperados: `400`, `404`, `422`; errores de stock dependen del servicio.

`PUT /cart/items/{item_id}`

- Params: `guest_token?`.
- Request: `{ quantity: number }`.
- Response: `CartRead`.
- Errores esperados: `404` carrito/item inexistente, `422`.

`DELETE /cart/items/{item_id}`

- Params: `guest_token?`.
- Response: `CartRead`.
- Errores esperados: `404`.

`POST /cart/merge`

- Auth: Bearer requerido.
- Request: `{ guest_token: string }`.
- Response: `CartRead` autenticado.
- Regla: si el usuario no tiene carrito activo, el carrito invitado pasa al usuario; si ya tiene carrito activo, se suman cantidades por variante y el carrito invitado queda convertido.
- Errores esperados: `401/403` sin sesion valida, `404` carrito invitado inexistente.

### Ordenes y pagos

`POST /orders`

- Request: `{ currency?, lines: [{ variant_id, quantity, unit_price? }], shipping_method?: "standard" | "express", discount_amount?, shipping_address?: ShippingAddress, notes? }`.
- Response: `OrderRead`.
- Notas: `shipping_amount`, `tax_amount` y `total_amount` se calculan en backend; en el flujo publico de creacion de orden tambien se usa el precio efectivo de la variante en servidor, no el precio enviado por el cliente.
- Errores esperados: `401/403` sin scope `orders:write`, `403` admin no puede comprar, `422`, errores de servicio por stock/estado.

`POST /orders/checkout-quote`

- Request: `{ currency?, lines: [{ variant_id, quantity, unit_price? }], shipping_method?: "standard" | "express", discount_amount?, shipping_address?: ShippingAddress | null }`.
- Response: `{ currency, subtotal_amount, discount_amount, shipping_amount, tax_amount, total_amount, shipping_method, shipping_zone, shipping_weight_grams, tax_rate, shipping_methods: [{ code, name, provider_code, provider_name, amount, currency, estimated_days_min, estimated_days_max, zone_code, weight_grams, selected }] }`.
- Uso: `/checkout` cotiza envio, impuestos y total antes de crear la orden. La API recalcula subtotal y peso con `variant_id`, no con precios o pesos enviados por cliente.
- Reglas actuales: zona derivada desde `ShippingAddress.country/state/postal_code`; proveedores `correo_argentino`, `andreani` y `dhl`; tarifa = base por zona/proveedor + tramo por kg facturable; envio standard gratis desde `CHECKOUT_FREE_SHIPPING_THRESHOLD`.
- Errores esperados: `422` para metodo de envio o direccion invalida.

`POST /orders/from-cart`

- Request: `{ guest_token?: string | null, shipping_method?: "standard" | "express", shipping_address?: ShippingAddress | null, notes?: string | null, discount_amount?: number | null, applied_promotions?: [{ promotion_id?, code?, name?, discount_amount?, metadata? }] }`.
- Response: `OrderRead`.
- Estado frontend: contrato expuesto en `ordersApi`; envio e impuestos se recalculan en backend aunque el cliente envie valores legacy.

`ShippingAddress`

- Shape: `{ address_line1: string, address_line2?: string | null, city: string, state: string, postal_code: string, country: string, phone?: string | null }`.
- Validacion: `address_line1`, `city`, `state`, `postal_code` y `country` son obligatorios si se envia direccion; `country` usa codigo de 2 letras; no acepta campos extra.

`GET /orders`

- Params: `status?`, `payment_status?`, `shipping_status?`, `user_id?`, `limit?`, `offset?`.
- Response: `OrderRead[]`.
- Errores esperados: `401/403`.

`GET /orders/{order_id}`

- Response: `OrderRead`.
- Errores esperados: `401/403`, `404`.

`POST /payments/orders/{order_id}`

- Headers opcionales: `Idempotency-Key`.
- Response: `PaymentRead` con `init_point` o `sandbox_init_point`.
- Errores esperados: `401/403`, `404`, errores Mercado Pago.

`GET /payments/orders/{order_id}/checkout-status`

- Auth: Bearer con `orders:read`.
- Response: `{ order_id, order_status, payment_status, shipping_status, currency, total_amount, paid_at, refunded_at, latest_payment?, checkout_result, can_retry_payment }`.
- `checkout_result`: `success | failure | pending | refunded | unknown`.
- Uso: pantalla `/checkout/success` consulta este endpoint cuando Mercado Pago devuelve `external_reference`.
- Errores esperados: `401/403`, `404`.

## 3. Decision tecnica

Decision: integrar parcialmente y ajustar backend antes de considerar produccion completa.

La API esta suficientemente completa para integrar catalogo, login/registro, carrito, ordenes autenticadas y preferencia de pago. Desde el 2026-04-24 `POST /orders/from-cart` puede recibir datos de checkout, `POST /cart/merge` preserva el carrito invitado despues del login, auth cuenta con reset password/logout con revocacion de refresh token compartida por Redis en produccion/staging, `/checkout/success` puede consultar estado consolidado por orden, el backend calcula metodos de envio e impuestos por zona/proveedor/peso, y categorias ya tiene contrato separado entre publico (`GET /categories`) y admin (`/admin/categories`). Para produccion completa aun falta disponibilidad publica por SKU.

## 4. Mapa de rutas frontend vs endpoints

| Ruta frontend | Vista/componente | Endpoints API |
|---|---|---|
| `/` | Home | `/products`, `/promotions/active`, `/exposure` segun secciones |
| `/login` | Login | `POST /auth/login`, `GET /auth/oauth/config`, `POST /auth/oauth/exchange`, `POST /cart/merge` |
| `/recuperar` | Recuperacion de password | `POST /auth/password/reset/request`, `POST /auth/password/reset/confirm` |
| `/registro` | Registro | `POST /users`, OAuth config/exchange |
| `/products` | Catalogo | `GET /products`, `GET /categories`, `GET /brands`, `GET /internal/scoring/rankings` si aplica |
| `/products/[slug]` | Detalle producto | `GET /products/{slug}`, `POST /cart`, `POST /cart/items`, `GET/POST /products/{product_id}/questions`, `POST /events`, `/wishes` |
| `/carrito` | Carrito | `POST /cart`, `GET /cart`, `PUT /cart/items/{item_id}`, `DELETE /cart/items/{item_id}` |
| `/checkout` | Checkout | `GET /cart`, `POST /orders/checkout-quote`, `POST /orders`, `POST /payments/orders/{order_id}` |
| `/checkout/success` | Confirmacion | `GET /payments/orders/{order_id}/checkout-status` con fallback a params de retorno |
| `/orders` | Mis pedidos | `GET /orders` |
| `/orders/[orderId]` | Detalle pedido | `GET /orders/{order_id}` |
| `/mi-cuenta` | Perfil | `GET /users/me`, `PUT /users/me` |
| `/lista-deseos` | Wishlist | `GET /wishes`, `POST /wishes`, `DELETE /wishes/{wish_id}` |
| `/promotions` | Promociones | `GET /promotions/active` |
| `/promotions/[promotionId]` | Detalle promocion | `GET /promotions/{promotion_id}`, `GET /promotions/{promotion_id}/eligibility` |
| `/loyalty` | Loyalty | `GET /loyalty/profile`, `GET /loyalty/levels`, `POST /loyalty/redeem` |
| `/notifications` | Notificaciones | `GET /notifications`, `PATCH /notifications/{notification_id}`, WebSocket |

## 5. Endpoints no usados o de uso administrativo

- Admin: `/admin/users`, `/admin/analytics/*`, `/admin/product-questions`, `/admin/promotions/*`.
- Backoffice catalogo: `/admin/categories` es el contrato canonico para categorias admin; `POST/PUT /products`, variantes, imagenes, stock movements, quality.
- Legacy catalogo: `GET /categories/all`, `POST /categories`, `PUT /categories/{category_id}` y `DELETE /categories/{category_id}` siguen activos solo por compatibilidad y estan deprecados en OpenAPI; el frontend no debe usarlos.
- Compras/proveedores: `/purchases/*`.
- Reportes: `/reports/*`.
- Pagos administrativos: `POST /payments/{payment_id}/refund`, `GET /payments/{payment_id}/audit`.
- Webhook: `POST /payments/mercado-pago/webhook`, consumido por proveedor, no por UI publica.
- Scoring interno: `/internal/scoring/*` esta fuera de OpenAPI y el frontend lo usa para ordenamiento por popularidad; conviene moverlo a contrato publico o retirarlo de UI publica.

## 6. Mejoras necesarias en backend

1. Exponer disponibilidad publica por SKU con estado de reserva/stock seguro para checkout.

## 7. Auditoria de estado 2026-04-25

### Validacion ejecutada

- Backend: `pytest tests\test_auth.py tests\test_token_blacklist.py tests\test_cart.py tests\test_categories.py tests\test_orders.py tests\test_payments.py tests\test_products.py tests\test_products_list.py tests\test_variants.py -q` -> OK, `45 passed`.
- Frontend: `npm run typecheck` -> OK.
- Frontend: `npm run build` -> OK.

### Estado funcional actual

- API y frontend web estan integrados para flujo cliente: auth, registro, catalogo, detalle, carrito, checkout autenticado, pagos, retorno de checkout, ordenes, wishlist, perfil, promociones, loyalty y notificaciones.
- Backoffice web tiene cobertura amplia: productos, categorias admin via `/admin/categories`, ordenes, promociones, preguntas, compras, reportes, analytics y exposure.
- Checkout usa calculo server-side para precio efectivo, peso, metodo de envio, zona, proveedor, impuestos y total.
- Revocacion de refresh token usa blacklist; en `ENVIRONMENT=production|staging` Redis es obligatorio mediante `REDIS_URL`.
- Las rutas admin legacy de categorias bajo `/categories` siguen disponibles solo por compatibilidad y estan deprecadas; el frontend debe usar `/admin/categories`.

### Riesgos operativos antes de continuar

- Ambos repos tienen muchos cambios sin commit y archivos no trackeados. Antes de iniciar un proyecto mobile conviene crear una rama o commit de checkpoint para congelar esta base.
- El unico pendiente backend productivo registrado es disponibilidad publica por SKU con estado de stock/reserva seguro para checkout.
- La app mobile debe partir del alcance cliente documentado en `D:\fast_api\docs\mobile_app_scope.md`; no debe incluir panel admin.

### Recomendacion para app mobile

Para rendimiento de contexto y manejo de tokens, conviene iniciar la app mobile en un contexto de trabajo nuevo. Este hilo ya contiene una larga secuencia de decisiones, diffs y validaciones web/backend; seguir aqui aumenta ruido contextual y riesgo de mezclar objetivos. El nuevo contexto deberia arrancar con estos documentos como fuente:

- `D:\app-ecommerce\my-app\docs\api-frontend-audit.md`
- `D:\fast_api\docs\mobile_app_scope.md`
- `D:\fast_api\docs\integracion_front_back_avances.md`

El contexto nuevo deberia tener como objetivo inicial: crear app cliente mobile con Expo + React Native + TypeScript, reutilizando contratos API actuales y dejando fuera todo admin.
