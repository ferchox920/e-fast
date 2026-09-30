# Verificación de integración

Los apartados de la primera etapa conservan evidencia histórica. El resultado vigente de la segunda etapa está al final.

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

- Clones nuevos `D:/e-fast-stage2` y `D:/ecommerce-fast-api-stage2`, árboles inicialmente limpios, `fetch origin --prune` en ambos. No se usó el checkout ajeno con cambios de `D:/fast_api`.
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
