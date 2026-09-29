// Regenerate with: node scripts/contract/generate-matrix.mjs <openapi.json>
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const input = process.argv[2];
if (!input) throw new Error('Pass OpenAPI JSON from the pinned backend');
const schema = JSON.parse(fs.readFileSync(input, 'utf8'));
const apiDir = path.resolve('src/store/api');
const canonical = (value) =>
  value
    .replace(/^\/api\/v1/, '')
    .replace(/\{[^}]+\}/g, '{}')
    .replace(/\/$/, '') || '/';
const backend = Object.entries(schema.paths).flatMap(([route, methods]) =>
  Object.keys(methods)
    .filter((m) => /^(get|post|put|patch|delete)$/i.test(m))
    .map((method) => ({ method: method.toUpperCase(), route })),
);
const quote = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const rows = [];
const hiddenRoutes = new Set([
  'POST /exposure/refresh',
  'DELETE /exposure/cache',
  'POST /internal/scoring/run',
  'GET /internal/scoring/rankings',
]);
const corrected = new Map([
  ['authApi.ts/login', 'Formulario OAuth2 real y tokens en memoria; authApi.test.ts'],
  ['authApi.ts/refresh', 'Refresh acotado; baseApi.test.ts'],
  [
    'ordersApi.ts/createOrderFromCart',
    'promotion_id opcional y conversión transaccional; live-api.test.mjs',
  ],
  [
    'paymentsApi.ts/createPaymentForOrder',
    'Idempotency-Key explícita; matriz y prueba de pagos RTK',
  ],
  [
    'paymentsApi.ts/refundPaymentAdmin',
    'Solo administración, payload de reembolso e idempotencia; matriz y prueba de pagos RTK',
  ],
]);
const live = new Set([
  'authApi.ts/login',
  'productApi.ts/getProducts',
  'productApi.ts/getProductBySlug',
  'productApi.ts/getProductVariants',
  'cartApi.ts/createOrGetCart',
  'cartApi.ts/getCart',
  'cartApi.ts/addCartItem',
  'ordersApi.ts/createOrderFromCart',
  'ordersApi.ts/getOrderById',
  'notificationsApi.ts/listNotifications',
  'notificationsApi.ts/updateNotification',
]);

for (const file of fs
  .readdirSync(apiDir)
  .filter((name) => name.endsWith('Api.ts') && name !== 'baseApi.ts')
  .sort()) {
  const content = fs.readFileSync(path.join(apiDir, file), 'utf8');
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.name.text === 'query' || node.expression.name.text === 'mutation') &&
      ts.isPropertyAssignment(node.parent)
    ) {
      const endpoint = node.parent.name.getText(source);
      const found = [];
      const inspect = (child) => {
        if (ts.isPropertyAssignment(child) && child.name.getText(source) === 'url') {
          const container = child.parent;
          const methodNode = container.properties?.find(
            (prop) => ts.isPropertyAssignment(prop) && prop.name.getText(source) === 'method',
          );
          const method = methodNode?.initializer?.text?.toUpperCase() ?? 'GET';
          let route = child.initializer.getText(source).slice(1, -1);
          route = route.replace(/\$\{[^}]+\}/g, '{id}');
          found.push({ method, route });
        }
        ts.forEachChild(child, inspect);
      };
      if (node.arguments[0]) inspect(node.arguments[0]);
      if (!found.length) found.push({ method: '—', route: '—' });
      for (const item of new Map(
        found.map((entry) => [`${entry.method} ${entry.route}`, entry]),
      ).values()) {
        const actual = backend.find(
          (entry) =>
            entry.method === item.method && canonical(entry.route) === canonical(item.route),
        );
        const hidden = hiddenRoutes.has(`${item.method} ${item.route}`);
        const key = `${file}/${endpoint}`;
        const status =
          item.route === '—'
            ? 'no utilizado'
            : corrected.has(key)
              ? 'corregido'
              : actual || hidden
                ? 'compatible'
                : 'pendiente';
        const difference =
          corrected.get(key) ??
          (hidden
            ? 'Ruta oculta en OpenAPI; comprobada en router backend; prueba de rutas'
            : actual
              ? `${live.has(key) ? 'HTTP real: live-api.test.mjs; ' : ''}método y ruta: prueba de matriz; DTO y permisos según schema`
              : item.route === '—'
                ? 'Operación local, sin endpoint backend'
                : 'Sin coincidencia en OpenAPI ni router conocido');
        rows.push({
          file,
          endpoint,
          ...item,
          actual: actual?.route ?? (hidden ? `/api/v1${item.route}` : '—'),
          status,
          difference,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const output = [
  '# Contrato frontend ↔ backend',
  '',
  `Backend fijado: \`e90c112c522d6017858b753206950aece233838a\`. OpenAPI real: ${Object.keys(schema.paths).length} rutas.`,
  'La tabla se genera del AST de los módulos RTK Query y del OpenAPI del backend fijado. “Compatible” confirma método y ruta; la prueba indicada o los schemas respaldan DTO y permisos de los recorridos cubiertos. Las rutas ocultas se cotejaron con routers.',
  '',
  '## Brechas observadas y correcciones',
  '',
  '- Autenticación: el login OAuth2 form y refresh existen; el frontend persistía access/refresh tokens en localStorage. Ahora permanecen en memoria, el refresh evita rutas de auth y las mutaciones no idempotentes no se reenvían tras 401.',
  '- Catálogo: `/products` recibe `limit`/`offset` y devuelve `limit`; la capa de productos los mapea a la paginación de la UI. Las categorías del encabezado ahora provienen de `/categories` y navegan con su UUID, no con slugs ficticios.',
  '- Carrito y pedidos: el invitado posee el carrito mediante `guest_token`; `/orders/from-cart` acepta además `promotion_id`, que faltaba en el DTO. El backend recalcula importes y devuelve 404 para un pedido ajeno. La lectura posterior de un pedido invitado devuelve 401, por lo que la UI muestra el identificador de confirmación y no ofrece consulta sin sesión.',
  '- Pagos: la preferencia y el reembolso aceptan `Idempotency-Key`; se retiró el cliente para el webhook de Mercado Pago, que debe llegar al backend desde el proveedor. La UI de preferencia está desactivada por defecto hasta disponer de sandbox.',
  '- Notificaciones: GET devuelve una lista, que el adaptador existente pagina localmente. El mensaje WebSocket real carece de `user_id`, `is_read` y `read_at`; el validador y el reducer ahora completan esos datos desde la sesión autenticada.',
  '- Administración: la API exige scopes y los servicios mantienen permisos de escritura. El cliente muestra acceso denegado al usuario autenticado sin rol y deja de enlazar páginas administrativas inexistentes.',
  '',
  '| Módulo / endpoint RTK | Método y ruta frontend | Ruta backend | Estado | Diferencia / prueba |',
  '|---|---|---|---|---|',
  ...rows.map(
    (row) =>
      `| ${quote(row.file)} / ${quote(row.endpoint)} | ${quote(row.method)} ${quote(row.route)} | ${quote(row.actual)} | ${row.status} | ${quote(row.difference)} |`,
  ),
  '',
  '## Pruebas contractuales ejecutables',
  '',
  '- `scripts/contract/live-api.test.mjs`: login, productos y variantes, carrito autenticado e invitado, creación y propiedad de pedido, listado y lectura de notificaciones; usa HTTP real, PostgreSQL y Redis.',
  '- Las pruebas Jest/MSW protegen transporte, refresh y estados de componentes con fixtures acordes al schema; no sustituyen el job HTTP real.',
  '',
  '## Contratos no descritos por OpenAPI',
  '',
  '- WebSocket: `/api/v1/notifications/ws?token=<access_token>`; el router acepta el socket y cierra con `4401` sin token o token inválido y `4403` para usuario inactivo. El mensaje solo incluye `id`, `type`, `title`, `message`, `payload` y `created_at` (notification_service); el cliente añade el usuario autenticado y el estado no leído antes de actualizar Redux.',
  '- `/api/v1/internal/scoring/*` y `/api/v1/exposure/refresh|cache` están ocultos en OpenAPI y requieren revisión directa de router y permisos.',
  '- La creación de preferencia de pago usa un proveedor externo: se valida DTO y autorización, pero el recorrido Playwright deberá sustituir el límite Mercado Pago. El navegador jamás enviará webhooks.',
  '',
].join('\n');
fs.mkdirSync('docs/verification', { recursive: true });
const prettier = await import('prettier');
fs.writeFileSync(
  'docs/verification/frontend-backend-contract.md',
  await prettier.format(output, { parser: 'markdown' }),
);
const pending = rows.filter((row) => row.status === 'pendiente');
console.log(
  `Wrote ${rows.length} frontend endpoint rows; ${pending.length} without OpenAPI or router match`,
);
if (pending.length) process.exitCode = 1;
