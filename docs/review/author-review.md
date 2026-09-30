# Comprobación visual y funcional del autor

## Resultado preparado

Esta guía contiene capturas reales y un entorno local de producción. La inspección del agente y las pruebas de navegador son automatizadas; **la aprobación visual del autor sigue pendiente**. Los PR permanecen abiertos. No hay despliegue público ni pagos reales.

Backend fijado: `807ab0140a155320bca2419949c80b046db9eece`. Frontend: HEAD de [PR #1](https://github.com/ferchox920/e-fast/pull/1); CI y SHA final se registran en el PR. Backend inicial de esta revisión: `aed8ea566e53d8d305f5cada33f8b0f63573f3e8`; frontend inicial: `aa338db4c179b5ad5e2db00852ace12ec155c906`.

## Capturas para revisar

Todas usan datos ficticios. Son PNG sin edición, exportados de los adjuntos del navegador contra Next en producción, FastAPI, PostgreSQL, Redis y proveedor local. Las imágenes de productos son placeholders deliberados.

| Pantalla                   | Escritorio                                     | Móvil Chromium emulado                        |
| -------------------------- | ---------------------------------------------- | --------------------------------------------- |
| Catálogo y agotado         | [Ver](images/desktop-catalog.png)              | [Ver](images/mobile-catalog.png)              |
| Detalle y variante         | [Ver](images/desktop-variant-detail.png)       | [Ver](images/mobile-variant-detail.png)       |
| Carrito                    | [Ver](images/desktop-cart.png)                 | [Ver](images/mobile-cart.png)                 |
| Proveedor local de pruebas | [Ver](images/desktop-local-provider.png)       | [Ver](images/mobile-local-provider.png)       |
| Pago pendiente             | [Ver](images/desktop-order-pending.png)        | [Ver](images/mobile-order-pending.png)        |
| Pago aprobado              | [Ver](images/desktop-order-approved.png)       | [Ver](images/mobile-order-approved.png)       |
| Pago rechazado             | [Ver](images/desktop-order-rejected.png)       | [Ver](images/mobile-order-rejected.png)       |
| Retorno sin sesión         | [Ver](images/desktop-return-session.png)       | [Ver](images/mobile-return-session.png)       |
| Nuevo login                | [Ver](images/desktop-return-login.png)         | [Ver](images/mobile-return-login.png)         |
| Confirmación invitado      | [Ver](images/desktop-guest-confirmation.png)   | [Ver](images/mobile-guest-confirmation.png)   |
| Pedido ajeno denegado      | [Ver](images/desktop-foreign-order-denied.png) | [Ver](images/mobile-foreign-order-denied.png) |

También se comprobó directamente con Playwright CLI en Chrome 155 la selección de talla M y la edición a cantidad 2: [carrito editado en escritorio](images/desktop-cart-edit.png), total servido 91.998,00 ARS. Las 22 capturas de la tabla proceden de las vueltas E2E (Chromium 153 / Playwright 1.63); las de login se regeneraron esperando el formulario visible. Esta captura adicional proviene del navegador local del agente. Ninguna representa una comprobación humana del autor.

## Acceso en el equipo del autor

Abre [catálogo local](http://127.0.0.1:59000/products). Funciona exclusivamente en el equipo donde se ejecuta el runner; no es una URL compartida por Internet. Cuenta ficticia: `user1.dev@example.com` / `UserDev123!`. Para la denegación usa `user2.dev@example.com` con la misma contraseña.

El modo de revisión mantiene los servicios propios durante hasta 60 minutos **después de completar las pruebas** y luego los retira. Para reiniciarlo, sigue la instalación del README y ejecuta desde el frontend:

```powershell
$env:E2E_BACKEND_DIR='../ecommerce-fast-api-e2e'
$env:E2E_REPEAT='2'
$env:E2E_REVIEW_MINUTES='60'
npm run test:e2e
```

También puedes usar una sola vuelta con E2E_REPEAT=1 para reabrir rápidamente un entorno ya verificado. En Linux usa las mismas variables antes del comando. Escribe `cerrar` y Enter en la terminal para finalizar antes: se limpian los procesos y el proyecto Docker propios. Esa acción **no aprueba ni fusiona ningún PR**. No ejecutes dos runners a la vez: los puertos son fijos. CI no habilita este modo de espera.

## Cinco comprobaciones del autor

1. Catálogo/detalle: leer precios y stock; elegir talla/color; comprobar que agotado no ofrece agregar. Usar Tab/Enter y el buscador con Escape. Confirmar que los controles se pueden alcanzar y que los textos se leen en escritorio y móvil.
2. Carrito: agregar, aumentar/reducir cantidad, quitar y crear pedido. Confirmar cantidad, moneda y total servido por la API. El título de cada fila sigue siendo Artículo N porque el DTO de carrito no contiene nombre; el pedido sí muestra el snapshot del producto.
3. Pago: en tres pedidos distintos, Preparar pago → Continuar al proveedor de pago → Mantener pendiente/Aprobar pago/Rechazar pago. El proveedor local es un doble sencillo, no el checkout de Mercado Pago. Elegir un estado envía un webhook firmado real a la API.
4. Retorno: Volver al comercio → nuevo login → consultar estado autorizado. Pendiente y rechazado no deben aparecer pagados. Recargar requiere ingresar nuevamente por la sesión en memoria.
5. Invitado/propiedad: en una sesión nueva sin login crear pedido y conservar su identificador; no se ofrece consulta privada sin sesión. Copiar la URL de un pedido de user1, entrar como user2 e intentar abrirla: debe mostrar el error de recurso no encontrado, sin revelar el pedido.

## Inspección automatizada y límites visibles

Se inspeccionaron capturas de escritorio y móvil, además del recorrido por navegador y teclado. Se encontró una etiqueta Disponible en un producto agotado y se corrigió: tarjeta/detalle indican Agotado, agregar queda deshabilitado y la selección rápida usa una variante activa con stock libre. Las pruebas exponen stock totalmente reservado y primera variante no disponible.

La presentación del carrito y del pedido sigue siendo básica; conserva etiquetas Artículo N y marca MyApp. No se hizo un rediseño. Las imágenes/SKU/usuarios son ficticios. El texto de preguntas del detalle es un área secundaria de la interfaz, fuera del recorrido comercial revisado. No se afirma una auditoría visual o de accesibilidad completa.

Límites relevantes: proveedor HTTP local sin validación del checkout real de Mercado Pago; envío/impuestos mediante fixtures explícitos; móvil Chromium emulado; sesión en memoria. Seeds, persistencia y webhook son reales en servicios descartables.

## Condición antes de fusionar

El autor debe confirmar explícitamente que comprobó este resultado visual y funcional tras los últimos cambios. La CI verde por sí sola no acredita esa comprobación. Tras esa confirmación se revisarán otra vez SHA/base/checks/protecciones, se fusionará primero backend y se verificará main; después frontend y su main. No se saltan protecciones, no se borran ramas ni se despliega.
