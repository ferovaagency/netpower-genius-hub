
Objetivo: agregar solo lo faltante, conservando diseño, colores, logo y estructura actual. Haré cambios puntuales sobre los componentes indicados y crearé solo las nuevas páginas/componentes solicitados.

1. Base de datos y compatibilidad mínima
- Crear en backend las tablas que hoy faltan: `products`, `availability_requests`, `orders`, `customers`.
- Añadir campos compatibles con lo que pides y con el código actual:
  - `products`: `id, slug, name, description, short_description, price, sale_price, sku, stock, images, category, brand, condition, warranty, specs, reviews, meta_title, meta_description, active, featured, created_at, updated_at`
  - `availability_requests`: datos cliente, items, total, status, admin_notes, suggested_products, created_at, updated_at
  - `orders`: referencia, cliente, items, total, status, payment data, created_at, updated_at
  - `customers`: email único, name, phone, city, created_at, updated_at
- Agregar RLS coherente para frontend público:
  - `products`: lectura pública solo si `active=true`; mutaciones abiertas solo para esta fase porque pediste `/admin` sin login.
  - `availability_requests`, `orders`, `customers`: políticas mínimas para inserts/updates/selects necesarios desde frontend.
- Unificar el código para usar `@/integrations/supabase/client` en vez de mezclar clientes distintos.
- Importante: hoy no aparecen tablas en backend, así que esta parte es requisito previo para que el resto funcione.

2. Productos desde backend sin tocar diseño
- `ShopPage.tsx`
  - Agregar `useEffect` al inicio para cargar `products` activos desde backend.
  - Mantener filtros, markup y estilos tal cual.
  - Si el backend devuelve vacío, conservar fallback a `src/data/store-data`.
  - Si el componente aún usa el array importado directamente, introducir solo el estado necesario para respetar tu instrucción.
- `ProductDetailPage.tsx`
  - Cambiar la carga para buscar primero por `slug` en backend y luego caer al método local actual.
  - Si `description` empieza por `<`, renderizar HTML; si no, mantener render normal.
- `HomePage.tsx`
  - Cargar destacados/ofertas desde backend primero y usar fallback local si no hay datos.
  - No tocar la estructura visual.

3. Scroll to top global
- En `App.tsx`, agregar `ScrollToTop` dentro de `BrowserRouter` antes de `Header`.
- No cambiar nada más del layout global salvo sumar nuevas rutas.

4. Guardado real de productos desde el generador
- `ProductSheetGeneratorPage.tsx`
  - Mantener el flujo actual y añadir guardado real en backend con `upsert`.
  - Ajustar el mapeo al esquema pedido (`short_description`, `meta_title`, etc.).
  - Antes de guardar, subir imágenes externas al bucket `product-images` usando helper tipo `uploadFromUrl`.
  - Reusar edición existente para que actualizar un producto persista de verdad.
- `supabase/functions/generate-product-sheet/index.ts`
  - Extender el prompt para que la IA asigne exactamente una categoría de tu lista nueva.
  - Mantener el resto del flujo de IA intacto.

5. Carga masiva CSV
- En `ProductSheetGeneratorPage.tsx`, agregar botón “Carga masiva CSV”.
- Implementar:
  - lectura con `FileReader`
  - parser simple por líneas/columnas
  - slug corto normalizado
  - subida de imagen al bucket
  - inserción por fila en `products`
  - progreso visual y resumen final
- Todo esto como bloque adicional, sin rehacer la página.

6. Tabla de gestión al final del generador
- En la misma página, al final:
  - cargar productos guardados al montar
  - buscador en tiempo real
  - tabla con miniatura, nombre, categoría, precio, estado
  - toggle activo/inactivo
  - editar: precargar el formulario existente y hacer scroll arriba
  - ver: abrir detalle en nueva pestaña
  - eliminar: confirmación y borrado
- Reusar helpers para no duplicar lógica.

7. Nuevo panel `/admin`
- Crear `src/pages/AdminPage.tsx` con tabs:
  - Aprobaciones
  - Productos
  - Pedidos
  - Usuarios
- Aprobaciones:
  - polling cada 8s
  - badge con pendientes
  - limpieza de solicitudes cerradas antiguas
  - acciones Disponible / No disponible con nota y sugeridos
- Productos:
  - tabla con buscador, toggle, ver, eliminar
- Pedidos:
  - cargar últimas 2 semanas o no entregados
  - modal de detalle y cambio de estado
- Usuarios:
  - tabla simple con buscador
- Agregar ruta `/admin` en `App.tsx`.
- Nota: como elegiste “sin login”, quedará funcional pero públicamente accesible; conviene protegerlo después.

8. Checkout con verificación de disponibilidad + pago
- `CheckoutPage.tsx`
  - Antes del pago:
    1. crear `availability_request`
    2. upsert de cliente
    3. no vaciar carrito
    4. mostrar modal/overlay con spinner y countdown 3 min
    5. polling cada 5s
  - Si queda disponible:
    - mostrar estado verde
    - botón “Ir a pagar”
    - crear/actualizar pedido
    - continuar con la integración real de Wompi
    - solo después limpiar carrito
  - Si queda no disponible:
    - mostrar nota admin
    - mostrar productos sugeridos
    - botón para volver a modificar pedido
  - Si expira:
    - permitir reintentar o volver a tienda
- Además, descontar inventario cuando el pago/pedido se confirme, no antes.
- Punto crítico: para Wompi de verdad faltará conectar credenciales/llaves antes de implementar la parte final del cobro.

9. Mi cuenta
- Crear `src/pages/MyAccountPage.tsx`
  - formulario con email + referencia
  - consulta del pedido
  - estado, productos, total y fecha
- Agregar ruta `/mi-cuenta`.
- En `Header`, añadir navegación del botón/ícono de usuario a esa ruta con cambio mínimo.

10. Legal, cookies y analítica
- `index.html`
  - insertar el snippet de GA4 con `G-MWRV7ZNCB9`.
- Crear `src/pages/LegalPage.tsx`
  - tabs: términos, tratamiento de datos, cookies
  - incluir datos de Netpower IT y la caja amarilla solicitada
- `Footer.tsx`
  - agregar links a `/legal`
- Crear `src/components/layout/CookieBanner.tsx`
  - banner oscuro
  - texto sobre cookies/GA
  - link a `/legal`
  - botón aceptar en `localStorage`
- Montarlo en `App.tsx` junto a WhatsApp y el chat.

11. Ajustes de integración y consistencia
- Revisar `useProducts.ts` porque hoy mapea columnas distintas a las que pediste; lo dejaré alineado al nuevo esquema para evitar que unas pantallas lean `short_desc/category_id` y otras `short_description/category`.
- Mantener `active=false` fuera de tienda/home/detalle.
- Evitar reescrituras completas: solo extensiones localizadas.

Riesgos y dependencias
- El backend actualmente no muestra tablas públicas; sin crear esquema no habrá persistencia ni panel admin.
- Wompi real requiere credenciales y definición del flujo exacto de retorno/webhook.
- `/admin` sin login funciona, pero no es seguro para producción; lo implementaré así porque lo pediste, dejando listo el camino para protegerlo luego.

Orden recomendado de implementación
1. Crear tablas + políticas + compatibilidad del cliente
2. Carga backend en tienda/home/detalle + scroll to top
3. Persistencia real en generador + gestión + CSV
4. Checkout con disponibilidad
5. Admin page
6. Mi cuenta
7. Legal + cookies + GA4
8. Integración real de Wompi

Detalles técnicos mínimos
```text
Frontend actual
 ├─ Shop/Home/Detail: fallback local -> preferir backend
 ├─ Generator: IA genera -> subir imagen -> upsert product
 ├─ Checkout: crea availability_request -> espera aprobación -> paga -> crea order
 ├─ Admin: gestiona approvals/products/orders/customers
 └─ My Account: consulta order por email + referencia
```
