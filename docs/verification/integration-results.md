# Verificación de integración

Los apartados siguientes conservan evidencia histórica de cada etapa, incluida la condición visual previa que el autor retiró. El cierre autorizado y la evidencia posterior a las fusiones se registran al final; la revisión visual humana sigue pendiente.

## Referencias fijadas

- Frontend `origin/main` al iniciar: `f9c6c72c33cee30894734632cc258430d26c5b31`.
- Backend separado y sin cambios: `e90c112c522d6017858b753206950aece233838a` en detached HEAD. La rama remota coincidía con ese SHA al iniciar.
- Entorno local: Node.js 24.19.0, npm 11.6.2, `package-lock.json`; Chrome 155.0.8059.12 y Edge 154.0.4258.37. El navegador queda para la siguiente etapa.

## Línea base antes de cambios

- `npm ci`: código 0, 14 alertas de auditoría npm (1 baja, 2 moderadas, 9 altas, 2 críticas).
- `npm run lint`: código 0; 68 advertencias y 1 información.
- `npm run typecheck`: código 0.
- `npm test -- --runInBand`: 18 suites, 52 pruebas aprobadas, 5 fallidas, 0 omitidas. Fallaban galería accesible, el mock del detalle y los mocks de imagen administrativa.
- `npm run build`: código 0; incluía rutas playground.

## Resultado local posterior

- `npm ci`: código 0; el lockfile es la única fuente de dependencias.
- `npm run test:routes`: 109 endpoints RTK cotejados con OpenAPI o routers; 0 rutas sin correspondencia.
- `npm run lint`: código 0, 66 advertencias y 1 información preexistentes en gran parte del repositorio.
- `npm run typecheck`: código 0.
- `npm test -- --runInBand --silent`: 22 suites, 83 aprobadas, 0 fallidas, 0 omitidas.
- `npm run build`: código 0, 18 páginas generadas, sin playground.
- `npm run test:contract` contra Uvicorn local, PostgreSQL 16 y Redis 7 descartables: 1 prueba de flujo aprobada, 0 fallidas u omitidas. Incluye login, scopes, catálogo, variante, carrito, pedido, propiedad horizontal, invitado, notificaciones y handshake WebSocket autorizado/4401. No usa MSW.

El resultado de GitHub Actions y CodeQL se verifica en el PR del SHA publicado. La preferencia de pago y su retorno quedan para Playwright con el límite externo de Mercado Pago sustituido por un sandbox o doble de proveedor. El backend devuelve 401 al leer un pedido invitado sin sesión; la UI conserva el identificador de confirmación y no promete esa consulta.

## Segunda etapa — 29 de septiembre de 2026

### Preparación y referencias

- Clones nuevos de ambos repositorios, árboles inicialmente limpios, `fetch origin --prune` en ambos. Se preservó el checkout ajeno con cambios.
- Frontend inicial: `3454f40feab9e736a07759aaf69369080c4ecfbd`, rama `portfolio/frontend-integration`, [PR existente #1](https://github.com/ferchox920/e-fast/pull/1).
- Backend inicial: `e90c112c522d6017858b753206950aece233838a`; ambas ramas remotas coincidían con las referencias auditadas y ambos PR estaban abiertos y sin fusionar.
- Backend publicado y utilizado: `b5c4941056bf88574de475a70ef1b163ca210afc`, [PR existente #1](https://github.com/ferchox920/ecommerce_fast_api/pull/1). Cambia únicamente la configuración del origen HTTP del proveedor y sus pruebas. El contrato público no cambia: se conserva OpenAPI/matriz de la primera etapa.
- Node 24.19.0, npm 11.6.2, Python 3.13, Docker 29.7.2, Playwright 1.63.0 y Chromium 153.0.8010.12; móvil iPhone 13 emulado con Chromium, no Safari físico.

### Dependencias: evidencia y correcciones

`npm ci` inicial instaló desde el lockfile. `npm audit --json` observó **14** paquetes vulnerables: 1 bajo, 2 moderados, 9 altos y 2 críticos. `npm audit --omit=dev --json` observó **4**: 3 altos y 1 crítico. Los otros 10 pertenecen al árbol de desarrollo, también expuesto al procesar entradas de pruebas, código o configuración no confiables.

| Paquete / severidad inicial         | Cadena y exposición                                          | Corrección                                                     |
| ----------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| next / crítica                      | aplicación → Next; servidor y build                          | 15.5.12 → 15.5.26, mismo minor                                 |
| sharp / alta                        | Next → sharp opcional; optimización de imágenes              | parche compatible del lockfile                                 |
| postcss / alta                      | Next → PostCSS y Tailwind → PostCSS; procesamiento CSS/mapas | 8.5.28; override limitado a Next porque conserva 8.4.31 exacto |
| nanoid / alta                       | Next → PostCSS → nanoid; también PostCSS de desarrollo       | parche compatible                                              |
| handlebars / crítica                | ts-jest → handlebars; plantillas de herramientas             | parche compatible                                              |
| @babel/core / baja                  | Jest → babel-jest → Babel; transformación de código/mapas    | parche compatible                                              |
| baseline-browser-mapping / moderada | Babel → browserslist → baseline-browser-mapping              | parche compatible                                              |
| browserslist / alta                 | Babel → browserslist; configuración de navegadores           | parche compatible                                              |
| brace-expansion / alta              | Jest/ts-jest → glob/minimatch → brace-expansion              | parches compatibles de sus dos ramas                           |
| js-yaml / alta                      | Jest → @istanbuljs/load-nyc-config → js-yaml                 | parche compatible                                              |
| minimatch / alta                    | Jest/ts-jest → glob/minimatch; patrones de archivos          | parches compatibles de sus dos ramas                           |
| picomatch / alta                    | Jest → jest-util → picomatch y MSW → picomatch               | parches compatibles                                            |
| ws / alta                           | jest-environment-jsdom → jsdom → ws                          | parche compatible                                              |
| yaml / moderada                     | Jest → jest-config → yaml                                    | parche compatible                                              |

Se aplicó `npm audit fix` sin `--force`; Next se fijó explícitamente a 15.5.26. El lockfile se regeneró con npm después de retirar su entrada anidada obsoleta de PostCSS, y una instalación limpia confirmó la resolución 8.5.28. No hubo actualización general de React, Redux ni salto a Next 16. No se usó `npm audit fix --force`.

Informes posteriores completos y de producción: **0 vulnerabilidades** en ambas ejecuciones. Esto es el resultado del registro npm en esta fecha, no una garantía de ausencia de defectos. Permanecen avisos de deprecación de `inflight`/`glob` en herramientas; no se confundieron con avisos de auditoría.

Referencias oficiales consultadas: [Next 15.5.26](https://github.com/vercel/next.js/releases/tag/v15.5.26), [aviso crítico de Next](https://github.com/advisories/GHSA-ggv3-7p47-pfv8), [Handlebars](https://github.com/advisories/GHSA-3mfm-83xf-c92r), [mapas PostCSS](https://github.com/advisories/GHSA-r28c-9q8g-f849), [PostCSS 8.5.28](https://github.com/postcss/postcss/releases/tag/8.5.28). Los JSON y cadenas ejecutados se guardaron localmente bajo `output/stage2` (ignorado).

### Lint y accesibilidad

El análisis inicial completo imprimió sus 67 diagnósticos, sin truncamiento: 42 parámetros sin uso, 18 uniones con `void`, 3 aserciones no nulas, 1 import sin uso, 1 import de tipos, 1 cadena opcional y 1 caso redundante de switch (información). Archivos: módulos `src/store/api`, `normalize.ts`, `ProductDescriptionCard.tsx`, prueba de NavBar y `renderWithProviders.tsx`.

Se corrigieron sin supresiones ni exclusiones adicionales. Las cuatro reglas a11y anteriormente desactivadas detectaron 19 errores: regiones de estado, agrupaciones de navegación, backdrop interactivo y botón sin tipo. Ahora `noStaticElementInteractions`, `useKeyWithClickEvents`, `useButtonType` y `useSemanticElements` están activadas y pasan. Regiones `aria-live` mantienen los anuncios, fieldsets agrupan controles y el backdrop es botón. El análisis final tiene **0 advertencias, 0 información, 0 errores**. No es una auditoría WCAG completa.

Los spies de `console.warn/info` están limitados a las pruebas que esperan esos mensajes y verifican su contenido antes de restaurarse. Los errores inesperados continúan visibles. Se aplicó el checklist React de hooks, efectos, estados derivados y accesibilidad sin refactor general.

### Defectos y pruebas que los protegen

| Resultado observable / evidencia                                                        | Corrección mínima                                                                                 | Protección                                                                       |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Login real inválido devuelve 400 y la UI mostraba error genérico                        | mensaje de credenciales incorrectas para 400                                                      | Jest auth + navegador desktop/móvil                                              |
| Build de producción local bloqueaba `ws` pese a ser loopback                            | permitir `ws` solo entre hosts loopback; hosts públicos siguen exigiendo `wss`                    | Jest configuración + navegador sin errores + contrato WS                         |
| Retorno del proveedor requiere ingresar otra vez; parámetros no son comprobante de pago | página de retorno con UUID opaco, enlace de login y consulta autorizada al servidor               | tres escenarios de pago en ambos tamaños                                         |
| Doble clic/reintento podía enviar preferencia con claves nuevas                         | guard inmediato y clave estable por pedido                                                        | dos clics, reintento, un pago persistido, replay firmado y stock sin duplicación |
| Tras convertir carrito invitado, POST /cart reutilizaba token y daba UNIQUE/500         | retirar token consumido, crear nuevo carrito y actualizar caché; conservar confirmación de sesión | Jest lifecycle token + navegador antes/después de recargar                       |
| Buscador abría panel pero no enviaba consultas; controles ocultos seguían montados      | formulario, enlaces de términos, parámetro aplicado, foco restaurado y contenido desmontado       | navegación con Enter/Escape y vacío por búsqueda real                            |
| Producto sin imagen usaba una foto externa ajena                                        | placeholder SVG local                                                                             | fixture real sin imagen y navegador desktop/móvil                                |
| Prevención: variante agotada/inexistencia del producto                                  | botón deshabilitado, selección disponible y eliminación de refetch continuo                       | fixture sin stock y tests existentes de detalle                                  |
| Prevención: límites visuales / navegación                                               | carrito adaptable, un solo main, textos reales de cuenta y retiro de enlaces sin implementación   | overflow, screenshots, suites de componentes y recorrido real                    |

Las ejecuciones de diagnóstico fallaron de forma observable antes de arreglar login, WS e invitado. Las mejoras preventivas no se presentan como fallos previos observados. Selectores ambiguos de combobox, buscador y alert de Next, y registro de modelos ORM del fixture, fueron errores del arnés corregidos, no defectos de producto.

### Frontera de pago y reproducibilidad

El runner construye Next en producción; PostgreSQL 16 usa tmpfs sin volumen persistente y Redis 7 se recrea en cada iteración. Alembic alcanza `e2b7a93c4d10`; se ejecutan los tres seeds ficticios y solo después fixtures del entorno descartable. El backend conserva rutas, autorización, inventario y persistencia reales. No hay MSW ni `page.route` en la suite E2E.

El doble reemplaza exclusivamente POST de preferencias y GET de pagos de Mercado Pago, con checkout HTML local. Un proceso Node independiente firma HMAC con request ID y timestamp y envía el webhook real; el navegador navega el checkout y retorno. Se verifican estado persistido, importes del servidor, pago único, evento duplicado, `paid_at` y stock invariables al repetirlo. Producción rechaza la URL del doble; no se agregaron endpoints públicos de test. Tokens, claves y cuentas son ficticios. Imágenes de seeds se sirven localmente y correo está deshabilitado.

Se esperan health/ready y disponibilidad HTTP con deadline; no se sustituyen por una espera fija. Fallos propagan código distinto de cero y el `finally` cierra solo procesos propios y su proyecto Docker. Ambos informes se conservan por separado con logs, captura final, screenshots y trazas de fallos. Reintentos Playwright: **0**; workers: **1**. Puertos fijos: no ejecutar dos runners simultáneos.

### Verificación backend ejecutada

- Ruff `app tests migrations scripts`: verde.
- Pytest unit/API: **94 aprobadas, 0 fallidas, 0 omitidas**, una advertencia de deprecación.
- PostgreSQL/Redis `service_checks`, `inventory_concurrency`, `refund_concurrency`, `commerce_flow`: **11 aprobadas, 0 fallidas, 0 omitidas**.
- Migración de base vacía y `alembic current`: head correcto.
- `scripts.verify_seed_idempotency` dos invocaciones: conteos estables y **0 conexiones externas**; primera empieza con tablas vacías.
- [Backend CI del SHA publicado](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36652403391) y [CodeQL](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36652403491): verdes.

### Verificación final frontend ejecutada localmente

| Comando                                                       | Resultado observado                                                                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                                      | 500 paquetes instalados; salida 0, 0 vulnerabilidades                                                                                        |
| `npm run lint` (y análisis completo `--max-diagnostics=1000`) | salida 0; 0 errores, advertencias e información                                                                                              |
| `npm run typecheck`                                           | salida 0                                                                                                                                     |
| `npm test -- --ci --runInBand`                                | 23 suites, 85 aprobadas, 0 fallidas, 0 omitidas; ejecución final con CLI Jest directa en PowerShell para preservar argumentos, JSON guardado |
| `npm run test:routes`                                         | 109 métodos/rutas, 0 sin correspondencia; matriz sin cambios                                                                                 |
| `npm run build`                                               | salida 0; Next 15.5.26, 19 páginas, sin playgrounds; build adicional con configuración E2E también verde                                     |
| `E2E_REPEAT=2 npm run test:e2e`                               | 14 aprobadas en cada base vacía; 33.26s y 34.43s, 0 fallidas, omitidas o flaky; retries 0                                                    |
| `npm run test:contract` / mismo CLI Node dentro del runner    | 1 aprobada por iteración, 0 fallidas/omitidas; HTTP, scopes, propiedad y WebSocket real                                                      |
| `npm audit --json`                                            | 0 en todas las severidades                                                                                                                   |
| `npm audit --omit=dev --json`                                 | 0 en todas las severidades                                                                                                                   |

Los reportes JSON distinguen las dos ejecuciones. Se inspeccionaron capturas finales del pedido aprobado en escritorio y móvil: sin desbordamiento horizontal; el importe y estado proceden de la API. Los listeners detectan errores de página/hidratación, consola inesperada, respuestas 5xx y solicitudes externas. No se agregaron skips ni se borraron suites existentes. La nueva suite añade 14 casos de navegador y 2 casos Jest (loopback WS y retiro de token).

### Límites comprobados

Se sustituyó el proveedor HTTP y no se hicieron cobros. No se valida disponibilidad, credenciales ni checkout real de Mercado Pago. El navegador móvil usa emulación Chromium; Safari/dispositivo físico y revisión completa de accesibilidad quedan fuera de esta suite. La sesión sigue en memoria y se pierde al recargar o salir del comercio; la UI lo explica y pide login. El invitado mantiene confirmación, pero GET del pedido sin sesión sigue devolviendo 401.

El backend conserva el aviso de Passlib sobre `bcrypt.__about__` durante el seed (la creación de usuarios y login pasan); no se amplió esta etapa a renovar autenticación Python. Los 109 métodos/rutas corresponden al contrato guardado: no equivalen a 109 recorridos probados ni a una nueva auditoría completa de DTO.

Próxima acción: revisión humana conjunta de los dos PR abiertos con los reportes de esta etapa.

## Cierre de cuatro brechas posterior a etapa 2

### Referencias y alcance

Se retomaron las ramas remotas de los PR con árboles limpios y `git fetch origin --prune`; no había avances posteriores a las referencias auditadas. Frontend inicial: `b41cc2902ae143b83bdb535f531f29768fdcde91`. Backend inicial: `b5c4941056bf88574de475a70ef1b163ca210afc`; publicado primero como [aed8ea5](https://github.com/ferchox920/ecommerce_fast_api/commit/aed8ea566e53d8d305f5cada33f8b0f63573f3e8). Ambos checkouts CI y el runner fijan ese SHA. No cambian rutas ni DTO públicos: OpenAPI y las 109 filas de la matriz permanecen iguales. Los dos PR siguen abiertos, sin fusionar.

Entorno local: Node 24.19.0, npm 11.6.2, Python 3.13, Playwright 1.63.0 / Chromium 153; PostgreSQL 16 y Redis 7 descartables. Instalaciones desde package-lock y requirements; sin bases o credenciales ajenas.

### Correcciones y protección

| Brecha                 | Implementación                                                                                                                                                                                                                                                                | Prueba                                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Importe de preferencia | Un ítem de cantidad uno representa el total autorizado; Decimal se serializa como número JSON exacto; metadata conserva líneas/snapshots y desglose. Rechaza importes no finitos, no positivos, fuera del rango Numeric o con fracciones de centavo antes del HTTP.           | 5 casos monetarios y 5 rechazos nuevos en el proveedor; 5 casos RTK sin precios del navegador; 4 nuevos escenarios ajustados del navegador en ambos tamaños.                                            |
| Primer aprobado        | Verifica pago único, pedido pagado, paid_at, moneda/importe, decremento de stock, liberación de reservas y exactamente un movimiento sale con la cantidad del pedido. Replay conserva todo. Pending/rejected conservan inventario, reservas, estado de pedido y paid_at nulo. | 7 escenarios de pago por navegador, incluyendo dos webhooks inválidos en el combinado; API backend también protege importe/moneda con 409.                                                              |
| Limpieza y errores E2E | Procesos propios/grupos Unix o árbol Windows; plazo y escalado forzado, logs drenados, retirada Docker incluso ante error, fallo original preservado. Detector por contexto/páginas y método/ruta/status, sin exclusión global de recursos.                                   | 6 pruebas del arnés: terminación adversarial, proceso ajeno intacto, descendiente terminado, último chunk de log, retirada aun con fallo, JS/hidratación/recursos/5xx/red/externos y permisos precisos. |
| CI formato y auditoría | Gates de formato, auditoría completa y producción con salida original; informes JSON guardados ante fallos; producción se ejecuta aun si falla auditoría completa.                                                                                                            | Ejecución local y jobs del SHA publicado; sin continue-on-error, filtros ni audit fix force.                                                                                                            |

La representación del proveedor usa los campos documentados `items.quantity`, `items.unit_price`, `currency_id` y `metadata`: [referencia oficial Mercado Pago](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post). El doble local calcula la suma de los ítems en centavos con BigInt; no consulta ni copia el total de PostgreSQL. El navegador solo envía identificador del pedido y clave idempotente.

Promociones se crean/activan por la API administrativa real. Envío/impuestos son un fixture explícito SQLAlchemy sobre el pedido pendiente en la base descartable, antes de crear la preferencia: el recorrido público actual no calcula esos cargos. El fixture exige test/local y ausencia de preferencia. No se agregaron endpoints ni funcionalidades comerciales.

La detección nueva encontró una imagen externa y `/collections` inexistente en la portada: se usa el recurso local y el catálogo existente. El carrito vuelve a consultar promociones al montar. Cancelaciones normales de Next requieren GET local, query RSC, header `rsc: 1` y `net::ERR_ABORTED`: únicamente precarga marcada por Next o navegación con respuesta 200 del mismo origen/ruta. Las solicitudes fallidas sin esas condiciones siguen fallando. HTTP deliberados: GET carrito 404 inicial, POST login 400 solo en credenciales inválidas, GET pedido ajeno 404 solo en el contexto de propiedad. Consola de recurso se reconcilia con la respuesta autorizada exacta; otras páginas y contexto secundario tienen listeners y limpieza.

### Fallos observados antes de la verificación final

- Proveedor: 10 pruebas nuevas fallaron antes de corregirlo (4 deseleccionadas por filtro de diagnóstico); después, las 14 del proveedor pasaron.
- Primer diagnóstico navegador quedó inválido por ejecutar npm ci mientras Next/Playwright tenían archivos bloqueados: EPERM y módulos parcialmente retirados. No se cuenta como suite aprobada. Se retiraron exclusivamente servicios propios y se reinstaló desde lockfile con salida 0 antes de repetir.
- Diagnósticos posteriores revelaron cancelaciones normales RSC y relaciones ORM faltantes del fixture de cargos. Una vuelta completa registró 16 aprobadas y 6 fallidas; no se ocultaron ni omitieron los casos. Se registraron las relaciones del pedido y se repitió desde cero. Las ejecuciones interrumpidas no se cuentan como verificación final.
- La prueba del detector falló una vez porque su respuesta 200 simulada usaba otro puerto/origen; se corrigió el fixture manteniendo la aserción de origen exacto.

### Backend local y CI del SHA final

Ruff: salida 0. Suite completa: 106 aprobadas, 0 fallidas/omitidas (aviso Starlette/anyio). Migraciones vacías hasta e2b7a93c4d10, seeds dos veces idempotentes y cero conexiones externas. Servicios/comercio/concurrencia: 11 aprobadas en PostgreSQL/Redis reales; proyecto retirado.

Se comprobaron jobs y logs de [Backend CI](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36657030303): unidad 106; servicios 3; comercio/concurrencia 8; migraciones y seeds dos veces; todo verde. [CodeQL backend](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36657030451) verde. El seed conserva el aviso previo de Passlib/bcrypt; creación de usuarios/login funcionan.

### Límites

No se hicieron cobros ni llamadas a Mercado Pago, Cloudinary o correo. No se verifica aceptación real del proveedor, su checkout ni credenciales. Los cargos son fixture, no UX de cálculo de envío/impuestos. Móvil es Chromium emulado, no Safari/dispositivo físico. La sesión sigue en memoria. No se amplió el alcance a refactor visual o actualización general de dependencias.

### Evidencia monetaria e inventario observada localmente

Primera vuelta, escritorio; todos los importes en ARS. Provider es el importe calculado por el doble a partir del payload. Inventario muestra `on_hand / reserved / movimientos de este pedido`.

| Escenario             | Subtotal | Descuento | Envío | Impuesto | Total API = proveedor | Cantidad | Antes       | Primer evento | Replay      |
| --------------------- | -------: | --------: | ----: | -------: | --------------------: | -------: | ----------- | ------------- | ----------- |
| Pendiente             | 45999.00 |         0 |     0 |        0 |              45999.00 |        1 | 500 / 1 / 1 | 500 / 1 / 1   | 500 / 1 / 1 |
| Aprobado sin ajustes  | 45999.00 |         0 |     0 |        0 |              45999.00 |        1 | 500 / 2 / 1 | 499 / 1 / 2   | 499 / 1 / 2 |
| Rechazado             | 45999.00 |         0 |     0 |        0 |              45999.00 |        1 | 500 / 2 / 1 | 500 / 2 / 1   | 500 / 2 / 1 |
| Descuento             | 45999.00 |   4599.90 |     0 |        0 |              41399.10 |        1 | 499 / 2 / 1 | 498 / 1 / 2   | 498 / 1 / 2 |
| Cargos                | 45999.00 |         0 |  1.21 |     0.79 |              46001.00 |        1 | 500 / 3 / 1 | 499 / 2 / 2   | 499 / 2 / 2 |
| Combinado             | 45999.00 |   4599.90 |  1.21 |     0.79 |              41401.10 |        1 | 498 / 2 / 1 | 497 / 1 / 2   | 497 / 1 / 2 |
| Centavos y cantidad 3 |     0.87 |      0.09 |  0.11 |     0.02 |                  0.91 |        3 | 500 / 3 / 1 | 497 / 0 / 2   | 497 / 0 / 2 |

Las reservas previas pueden incluir otros pedidos pendientes; se verifica el delta exacto de cada variante. Movimiento inicial reserve; en aprobado se agrega una sola sale por la cantidad exacta. `payment-inventory-evidence` adjunta pedido/pago antes, después y replay, payload del proveedor y movimientos reales. En combinado, importe y moneda incorrectos devolvieron 409 sin alterar stock ni paid_at; después el webhook correcto se aceptó. El replay devuelve `{status: duplicate}` y conserva paid_at, importes, pago único e inventario.

Cierre adversarial local: escalado forzado en 332 ms con grace 200 ms y force 1500 ms; plazo comprobado menor de 2500 ms; proceso ajeno sigue vivo. La prueba de descendientes confirmó su terminación y último chunk del log. La prueba con fallo de cierre conserva la misma instancia del error original y aun intenta retirar Docker. Las vueltas reales retiraron solo sus proyectos/servicios y no registraron fallos de limpieza.

### Verificación final frontend local

| Control                                              | Resultado ejecutado                                                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm ci                                               | Salida 0; 500 paquetes desde lockfile; advertencias upstream inflight/glob; 0 vulnerabilidades.                                                       |
| npm run check                                        | Lint, tipos y formato: salida 0; 0 diagnósticos de lint.                                                                                              |
| Jest CLI directa (preserva argumentos en PowerShell) | 23 suites, 90 aprobadas, 0 fallidas/omitidas; JSON guardado.                                                                                          |
| npm run test:harness                                 | 6 aprobadas, 0 fallidas/omitidas.                                                                                                                     |
| npm run test:routes                                  | 109 filas, 0 sin correspondencia; matriz sin cambios.                                                                                                 |
| Build de producción                                  | Salida 0; 19 páginas. Build del runner también verde.                                                                                                 |
| E2E_REPEAT=2                                         | 11 escenarios únicos x 2 proyectos Chromium = 22 ejecuciones por vuelta. 22 + 22 aprobadas (72.730s y 71.737s), 0 fallidas/omitidas/flaky; retries 0. |
| Contrato HTTP/WebSocket real dentro del runner       | 1 aprobada por vuelta, 0 fallidas/omitidas; sin MSW.                                                                                                  |
| npm audit --json                                     | Salida 0; total 0 en todas las severidades.                                                                                                           |
| npm audit --omit=dev --json                          | Salida 0; total 0 en todas las severidades.                                                                                                           |

Ambas vueltas aplicaron migraciones/seeds desde bases nuevas y retiraron sus propios contenedores, red y procesos. Los informes separados guardan JSON, capturas y adjuntos `payment-inventory-evidence`; CI conserva ambos informes/logs como `full-stack-diagnostics`. La evidencia local anterior no sustituye CI: [PR frontend y checks del HEAD publicado](https://github.com/ferchox920/e-fast/pull/1/checks), [workflow frontend](https://github.com/ferchox920/e-fast/actions/workflows/frontend-ci.yml), [CodeQL frontend](https://github.com/ferchox920/e-fast/actions/workflows/codeql.yml). Los resultados del SHA final se registran en el PR tras inspeccionar jobs y logs.

Próxima acción única: revisión humana conjunta de los dos PR una vez cerrado técnicamente este trabajo.

## Snapshot y preparación visual antes de fusionar

Referencias iniciales de esta revisión: backend `aed8ea566e53d8d305f5cada33f8b0f63573f3e8`, frontend `aa338db4c179b5ad5e2db00852ace12ec155c906`. Fetch en ambas ramas remotas y árboles inicialmente limpios; PR #1 abiertos, base main, sin conflictos observados al iniciar. No se alteró el checkout ajeno ni se modificó main.

Backend publicado primero: [807ab0140a155320bca2419949c80b046db9eece](https://github.com/ferchox920/ecommerce_fast_api/commit/807ab0140a155320bca2419949c80b046db9eece). El proveedor lee `product_title_snapshot`, atributo real de OrderLine. Cinco casos parametrizados usan el modelo real y verifican título histórico literal, SKU, cantidad, variante y precio; inicialmente 5 fallaron / 9 deseleccionadas por filtro (title=null); después 27 relacionadas aprobadas y Ruff verde. [Backend CI](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36661957065) y [CodeQL](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36661957071) verdes; logs inspeccionados: 106 unidad/API, 3 servicios, 8 comercio/concurrencia, migraciones vacías y seeds idempotentes. Contrato público, importes y garantías sin cambios; no se regeneran OpenAPI/matriz.

El pin activo del runner, ambos checkouts CI y README ahora usan 807ab01; los SHA de secciones anteriores son evidencia histórica. Frontend se publica en el PR existente; resultados de CI del HEAD se registran en su descripción, sin interpretar CI como aprobación humana.

Se preparó la [guía concreta del autor y sus capturas](../review/author-review.md). Los adjuntos capturan catálogo/detalle/variante/carrito, proveedor local, tres estados de pago, retorno/login, invitado y denegación de pedido ajeno en ambos proyectos. PNG sin edición, datos ficticios. El modo E2E_REVIEW_MINUTES mantiene los servicios propios hasta 60 minutos después de la última vuelta y aplica la limpieza existente; cerrar + Enter termina antes. Se ejecutó y comprobó el cierre manual del primer entorno, luego se creó otro desde cero.

Inspección visual automatizada: se encontró Disponible en un producto agotado. La corrección usa variantes activas y stock libre (`on_hand - reserved`) para etiqueta y selección rápida, deshabilita agregar sin stock y muestra Agotado en detalle. No sustituye la validación transaccional del backend. Pruebas antes: 3 fallidas / 2 aprobadas; después suite completa 92 aprobadas, 0 fallidas/omitidas (23 suites). E2E protege etiqueta y botón agotado en catálogo/detalle; incluye teclado, cantidad, creación, pagos y autorización. La presentación de carrito/pedido sigue básica y las filas de carrito son Artículo N (DTO sin título); se declara en la guía, sin refactor o funcionalidad comercial nueva.

Verificación local final: lint/formato/tipos verdes; arnés 6 aprobadas; matriz 109 filas sin cambios; build de producción 19 páginas verde. Dos vueltas desde PostgreSQL/Redis nuevos: 22 + 22 aprobadas, 84.744s y 81.297s, skipped/unexpected/flaky=0 y retries=0; contrato HTTP/WebSocket real 1 aprobado en cada vuelta. El primer proyecto fue retirado; el segundo queda temporalmente abierto para la revisión local del autor y luego se limpia automáticamente. El lector no debe confundir esa espera deliberada con recursos abandonados. Las auditorías y la instalación limpia se vuelven a verificar en CI del commit publicado.

**Aprobación visual y funcional del autor pendiente. Ambos PR permanecen abiertos.** La autorización de fusión está condicionada a esa comprobación concreta; no se solicitará una revisión de GitHub inventada ni se omitirán protecciones. Después se fusionará backend, se verificará su main, se conservará el SHA exacto accesible y se fusionará frontend; luego se verificará su main. CV y puntos de entrevista finales se entregarán tras ambos main verdes. No hay despliegue, release, cobro real ni borrado de ramas.

Antes de la entrega se detectó que la captura de login de escritorio repetía el retorno por tomarse durante la transición. Se espera ahora el Email visible antes de capturar. Una vuelta adicional limpia aprobó 22 casos (88.994s, 0 fallidas/omitidas/flaky) y el contrato real; las capturas desktop/móvil de login se reemplazaron e inspeccionaron y muestran el formulario. Es una corrección de evidencia, sin cambios de producto. El entorno temporal del autor corresponde a esta última vuelta.

## Cierre autorizado del 30 de septiembre de 2026

El autor retiró expresamente la confirmación visual humana previa y autorizó fusionar basándose en la revisión técnica y las pruebas automatizadas. La revisión visual humana sigue pendiente y no bloquea este cierre. Las condiciones de apartados anteriores son históricas; no acreditan una revisión humana realizada.

Se comprobaron SHA, bases, conflictos y checks en GitHub, sin omitir protecciones. [Backend PR #1](https://github.com/ferchox920/ecommerce_fast_api/pull/1) se fusionó primero mediante merge commit `04992ab6e5a8be7d6199d701e921f62f08223ada`; su CI y CodeQL pasaron antes de fusionar [frontend PR #1](https://github.com/ferchox920/e-fast/pull/1), merge commit `e1250cb4be7d61d311c3fdd7c1cd63eacdb47754`. Las ramas originales se conservan. El pin exacto `807ab0140a155320bca2419949c80b046db9eece` sigue accesible y es ancestro del main del backend.

Los ajustes posteriores se publicaron mediante PR pequeños: [backend #8](https://github.com/ferchox920/ecommerce_fast_api/pull/8) enlaza frontend y guía; [frontend #5](https://github.com/ferchox920/e-fast/pull/5) documenta la autorización y corrige una espera de prueba. La CI original del ajuste registró 21 aprobadas / 1 fallida: buscar `2` en toda la fila podía coincidir con el precio `0.29` antes del cambio de cantidad. Ahora espera el elemento de cantidad exacta antes del siguiente clic; no cambió código de producción, retries ni escenarios. Ambas ejecuciones del SHA corregido pasaron 22 + 22 antes de fusionar.

Evidencia inspeccionada después de las fusiones:

- Backend main `9dfed1eac708d42d9e5c2572320df67192dcec33`: [CI](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36710703706), [CodeQL](https://github.com/ferchox920/ecommerce_fast_api/actions/runs/36710703750); 106 unidad/API, 3 servicios y 8 comercio/concurrencia aprobadas; Ruff, migraciones vacías y dos verificaciones de seeds idempotentes con cero conexiones externas. Una advertencia upstream de deprecación de BlockingPortal, sin fallo.
- Frontend main `ccd072cd95026e883fa2f090ad5d51e171f33773`: [CI](https://github.com/ferchox920/e-fast/actions/runs/36712552785), [CodeQL](https://github.com/ferchox920/e-fast/actions/runs/36712552769); lint, formato, tipos, build, auditorías npm completa/producción, 92 Jest en 23 suites y 6 controles del arnés verdes. Matriz conservada: 109 filas, cero sin correspondencia.
- Contrato HTTP/WebSocket real: 1 aprobada, 0 fallidas/omitidas, PostgreSQL/Redis reales y backend fijado, sin MSW. Full-stack de producción: 22 + 22 aprobadas desde servicios limpios, contrato adicional aprobado en cada vuelta y limpieza de recursos propios. [Informes y logs](https://github.com/ferchox920/e-fast/actions/runs/36712552785/artifacts/11095116807). Este registro corresponde a esos SHA; los checks de cualquier commit documental posterior se enlazan en su PR y en la entrega final.

Material accesible: [guía y 23 capturas](../review/author-review.md), [presentación para CV e entrevista](../review/portfolio.md). Límites: proveedor local sin cobros ni validación de Mercado Pago real, envío/impuestos mediante fixtures, móvil Chromium emulado, sesión en memoria y revisión visual humana pendiente. No hubo despliegue, release, licencia nueva ni borrado de ramas. Próxima acción: evaluación visual humana con la guía existente.
