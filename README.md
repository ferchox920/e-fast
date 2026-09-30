# e-fast

Cliente Next.js 15 y RTK Query para la API de [ecommerce_fast_api](https://github.com/ferchox920/ecommerce_fast_api). Las pruebas reales fijan `807ab0140a155320bca2419949c80b046db9eece` (`portfolio/backend-foundation`, PR #1). El backend sigue siendo un repositorio independiente. El OpenAPI guardado sigue vigente: las correcciones del proveedor HTTP local y del importe de la preferencia no cambian rutas ni DTO públicos.

## Requisitos y configuración

- Node.js 24, npm 11 y `package-lock.json`.
- Copia `.env.example` a `.env.local` y configura `NEXT_PUBLIC_API_BASE_URL` con la URL HTTP absoluta que termine en `/api/v1` exactamente una vez, por ejemplo `http://localhost:8000/api/v1`.
- `NEXT_PUBLIC_API_WS_BASE_URL` es opcional. Se deriva de la URL HTTP usando `ws` o `wss` y debe terminar en `/api/v1`. `NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED=false` desactiva explícitamente el canal en tiempo real.
- No hacen falta credenciales de proveedores para instalar, probar ni construir. La sesión Bearer se mantiene solo en memoria; recargar la página requiere ingresar de nuevo. El token de carrito invitado se guarda localmente como token de posesión del carrito.

```bash
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test -- --runInBand
npm run test:harness
npm audit --json
npm audit --omit=dev --json
npm run build
npm run dev
```

Configura `NEXT_PUBLIC_API_BASE_URL` también en el entorno del build. No hay una URL de producción implícita. `npm run test:contract` exige `CONTRACT_API_BASE_URL` y una API local ya migrada y poblada con los seeds ficticios del backend fijado; envía HTTP real y no usa MSW.

## Contrato y verificación

La [matriz frontend-backend](docs/verification/frontend-backend-contract.md) enumera los endpoints RTK Query y su correspondencia con el [OpenAPI fijado](docs/verification/backend-openapi-e90c112.json). Se regenera con `node scripts/contract/generate-matrix.mjs docs/verification/backend-openapi-e90c112.json`. Para WebSocket y comportamientos transaccionales se revisaron además routers, schemas y pruebas del backend.

GitHub Actions ejecuta lint, formato, auditoría npm completa y de producción, tipos, Jest, arnés, build, CodeQL, contrato HTTP/WebSocket y un job Playwright separado que repite el recorrido comercial dos veces con servicios descartables. No llama a Mercado Pago, Cloudinary ni correo. Un proceso independiente firma y envía eventos al webhook real; regresar del checkout no confirma un pago.

## Recorrido full-stack reproducible

Requiere Docker con Compose, Python 3.13 y los puertos locales 55434, 56380, 59000, 59001 y 59002 libres. Ejecuta desde este repositorio:

```bash
git clone https://github.com/ferchox920/ecommerce_fast_api ../ecommerce-fast-api-e2e
git -C ../ecommerce-fast-api-e2e checkout --detach 807ab0140a155320bca2419949c80b046db9eece
python -m venv ../ecommerce-fast-api-e2e/.venv
../ecommerce-fast-api-e2e/.venv/bin/python -m pip install -r ../ecommerce-fast-api-e2e/requirements.txt
npm ci
npx playwright install --with-deps chromium
E2E_BACKEND_DIR=../ecommerce-fast-api-e2e E2E_REPEAT=2 npm run test:e2e
```

En PowerShell usa `.venv/Scripts/python.exe` para instalar Python y asigna `$env:E2E_BACKEND_DIR='../ecommerce-fast-api-e2e'` y `$env:E2E_REPEAT='2'` antes de `npm run test:e2e`. El runner detecta ese ejecutable. `E2E_PYTHON` permite indicar otro Python instalado con los requisitos del backend.

No copies archivos privados de entorno. El runner comprueba el SHA, construye Next en producción, crea PostgreSQL 16 sin volumen persistente y Redis 7, aplica migraciones/seeds, inicia el proveedor local, la API y el frontend, y espera disponibilidad con timeout. Finalmente elimina solo sus propios procesos y proyecto Compose. No ejecutes dos runners simultáneos: usan puertos fijos.

Los 11 escenarios únicos se ejecutan en escritorio y móvil: 22 ejecuciones por vuelta, sin reintentos. Incluyen descuentos creados mediante la API administrativa, cargos y redondeo, rechazo de webhooks con importe/moneda incorrectos y consumo/liberación de inventario en el primer aprobado. `adjust-order.py` aplica envío e impuestos únicamente como fixture explícito en la base descartable antes de la preferencia: el checkout público actual no calcula esos cargos. El proveedor local suma los ítems recibidos en centavos; no obtiene el total desde la base.

`scripts/e2e/backend-ref.json` y ambos checkouts del workflow deben apuntar al mismo SHA. Las credenciales ficticias y secretos del runner sirven exclusivamente para sus servicios locales. `E2E_BUILD=true` habilita imágenes locales sin optimización para este build; `NEXT_PUBLIC_PAYMENTS_ENABLED=true` muestra la preferencia de pago. `MERCADO_PAGO_API_BASE_URL` exige `APP_ENV=test` y un origen HTTP de loopback; producción mantiene el proveedor oficial. No existen endpoints de prueba en la aplicación.

Los reportes independientes, capturas, trazas de fallos y logs quedan en `output/playwright/run-1`, `run-2` y los logs contiguos. `npx playwright show-report output/playwright/run-1/report` abre el informe. La CI los conserva como `full-stack-diagnostics`. Consulta [resultados y limitaciones](docs/verification/integration-results.md).

La [guía de comprobación del autor](docs/review/author-review.md) conserva capturas reales de escritorio y móvil, accesos ficticios y cinco comprobaciones. La revisión visual humana está pendiente; el autor autorizó el cierre basándose en revisión técnica y pruebas automatizadas, sin exigirla antes de fusionar. `E2E_REVIEW_MINUTES=60` mantiene los servicios locales durante ese plazo tras la última vuelta y los limpia al finalizar; escribir `cerrar` y Enter termina antes. CI no habilita esa espera. Este entorno es local, sin despliegue ni cobros reales.

## Estado inicial observado

En `f9c6c72c33cee30894734632cc258430d26c5b31`, con Node 24.19.0 y npm 11.6.2, `npm ci`, lint, TypeScript y build finalizaron con código 0. Jest registró 52 aprobadas y 5 fallidas (18 suites); los fallos de galería, detalle y mocks de imágenes se corrigieron en esta rama. `npm ci` informó 14 alertas de dependencias; no se actualizó Next, React ni Redux de forma general.
