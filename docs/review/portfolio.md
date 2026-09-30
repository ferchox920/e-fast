# Presentación del e-commerce

Repositorios independientes: [e-fast](https://github.com/ferchox920/e-fast) y [ecommerce_fast_api](https://github.com/ferchox920/ecommerce_fast_api). Sus README explican la instalación desde lockfiles, configuración local y ejecución desde cero. La [guía de evaluación](author-review.md) conserva 23 capturas reales de escritorio y móvil; el [informe de verificación](../verification/integration-results.md) conserva resultados y enlaces a CI por etapa.

## Descripción breve para CV

Desarrollo e integración de un e-commerce con Next.js, TypeScript, Redux Toolkit/RTK Query y FastAPI, PostgreSQL y Redis. Implementé contratos API verificables, autenticación y autorización, carrito, pedidos e inventario transaccional, y un recorrido de pagos con webhooks e idempotencia ejercitado mediante un proveedor local. Establecí migraciones, seeds reproducibles y CI con pruebas unitarias, contractuales, Playwright y CodeQL.

## Cinco puntos para una entrevista

1. **Contrato frontend-backend:** contrasté RTK Query con OpenAPI, routers y pruebas. Separé DTO de escritura/lectura y fijé un commit exacto del backend para que el contrato no cambie durante la verificación.
2. **Autorización y sesión:** el backend controla permisos y propiedad de pedidos; las pruebas verifican acceso ajeno denegado. El cliente conserva tokens en memoria y trata expiración, refresh y errores sin repetir automáticamente mutaciones no idempotentes.
3. **Inventario y dinero:** PostgreSQL aplica transacciones, bloqueos y restricciones. El backend determina precios y totales; las líneas conservan SKU y título histórico, comprobado con un OrderLine real. La integración verifica reserva, venta y efectos únicos del primer pago aprobado.
4. **Pagos comprobables:** un proveedor HTTP local ejercita preferencias y webhooks firmados contra la API real, incluidos rechazo de importe/moneda incorrectos y replay idempotente. El retorno del navegador no confirma por sí solo un pago.
5. **Reproducibilidad y evidencia:** dependencias fijadas, migraciones y seeds desde cero, PostgreSQL/Redis descartables, contrato sin MSW y dos vueltas Playwright de producción. CI, CodeQL, informes y capturas permiten explicar qué se comprobó y sus límites.

## Límites declarados

- Proveedor de pago local, sin cobros reales ni validación del checkout real de Mercado Pago.
- Envío e impuestos ejercitados mediante fixtures explícitos.
- Móvil Chromium emulado; no pruebas en dispositivos físicos.
- Sesión mantenida en memoria; recargar requiere nuevo login.
- Revisión visual humana pendiente. La inspección del agente y las pruebas automatizadas no la sustituyen.
- Sin despliegue público, clientes ni métricas comerciales declaradas.

Próxima acción recomendada: realizar la evaluación visual humana con las cinco comprobaciones de la guía existente.
