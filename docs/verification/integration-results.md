# Verificación de la primera etapa

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
