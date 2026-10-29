# Registro de validación — 2026-10-28

**Entorno:** local, Wrangler 4.154.0, `npm run dev` con `--ip 0.0.0.0 --port 8788`.  
**Estado:** flujo de contenido, admin e imágenes operativo; chat con IA deshabilitado por defecto.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `npm run dev` | `Ready on http://0.0.0.0:8788` |
| `GET /` | 200 `text/html` |
| `GET /api/content?key=config` | 200 JSON |
| `GET /api/content?key=catalogo` | 200 JSON |
| `GET /api/content?key=landing` | 200 JSON |
| `GET /api/content?key=faq` | 200 JSON |
| `POST /api/login` con contraseña incorrecta | 401 |
| `POST /api/login` con contraseña correcta | 200 `{ok:true}` + cookie |
| `GET /api/session` con cookie | 200 `{authenticated:true}` |
| `GET /api/session` sin cookie / tras logout | 401 |
| `PUT /api/content?key=config` sin cookie | 401 |
| `PUT /api/content?key=config` con cookie | 200 `{ok:true,updated_at}` |
| `PUT /api/content` con cookie para `catalogo`, `landing` y `faq` | 200 |
| `PUT` con moneda o categoría inválidas | 400 con `detalle` en español |
| `POST /api/upload` sin cookie | 401 |
| `POST /api/upload` con cookie (`pan-integral`) | 200 `{ok:true,url,key}` |
| `GET /api/image?id=pan-integral` | 200 `image/png` |
| `GET /api/image?url=items/pan-integral.png` | 200 `image/png` |
| `GET /api/image?id=no-existe` | 404 |
| `GET /api/image?id=../x` | 404 |
| `GET /admin/identidad` sin cookie | 302 a `/admin/index.html` |
| `GET /admin/identidad` con cookie | 200 |
| `GET /admin/catalogo`, `/admin/fotos`, `/admin/landing`, `/admin/faq` con cookie | 200 |
| `POST /api/logout` | 200; cookie invalidada |
| `POST /api/chat` sin binding `AI` | 503 con mensaje accionable |
| `GET /` y `GET /api/content?key=config` por IP LAN | 200 |
| Guardar identidad, catálogo, landing y FAQ desde el admin (navegador) | OK, persiste en KV |
| Subir foto y regenerar preview desde `admin/fotos.html` | OK |
| Ficha de producto: imagen, precio, descripción y chip tipo/categoría | OK |
| Contador del carrito y checkout por WhatsApp | OK; abre `api.whatsapp.com` con el mensaje |
| `PUT` de catálogo con `categorias_agendamiento` inexistente | 400 con `detalle` en español |
| `PUT` de catálogo con `categorias` tipadas (`producto`/`servicio`) | 200; GET devuelve el objeto |
| `PUT` con un producto en una categoría de servicio | 400 con `detalle` en español |
| `PUT` con `categorias` en formato array legacy | 200; se mantiene la compatibilidad |
| Sintaxis de JS de `functions/` y `public/assets/` | `node --check` OK |
| Sintaxis de scripts inline de los HTML | `node --check` OK |

## Estado local

- KV local: `config`, `catalogo`, `landing` y `faq` sembradas en `.wrangler/state`.
- Imágenes (migradas de R2 a KV `IMAGES` el 2026-10-28): 5 fotos servidas por `/api/image`; subida autenticada y 401 sin sesión verificados.
- `wrangler.toml`: `[ai]` comentado; `/api/chat` responde 503.
- `ADMIN_PASSWORD` vive en `.dev.vars`; no se imprime ni se versiona.

## No verificado todavía

- Interacción en navegador con las pestañas Productos/Servicios, la migración de categorías legacy y los checkboxes de `categorias_agendamiento`.
- Diseño a 375px y escritorio.
- Chat con Workers AI (requiere descomentar `[ai]` y `npx wrangler login`).
- No hay UI de chat en las páginas públicas.
- Los scripts `validate-phase*.sh` y `test-all-phases.sh` no se usaron como prueba de runtime: son greps estáticos y tienen falsos positivos/negativos.
- No hay `.git`, `npm test`, `npm run lint` ni `npm run typecheck`.

## 2026-10-29 — Fase 1: servicios sin carrito
- Lógica `accionItem` probada con Node (producto mixto/solo-servicios, cotizar, reservar, consultar).
- jsdom contra `npm run dev` (KV local): en `mixto` los productos llevan «Añadir al Carrito» y los servicios «Consultar por WhatsApp»/«Reservar Cita»; en `solo-servicios` se oculta icono y enlaces del carrito, `/carrito` muestra aviso y la ficha de servicio no muestra el botón de carrito. Config restaurada a `mixto` tras la prueba.
- Pendiente: revisión visual a 375px en navegador real.

## 2026-10-29 — Fase 2: modelo de servicio
- Validadores movidos a `functions/_lib/validadores.js`; 15 casos probados con Node (ejemplos válidos; modalidad, variantes, incluye, URLs, email, `items_ids`).
- API real: PUT catálogo con variantes inválidas -> 400 en español; válido -> 200. PUT landing con item inexistente -> 400.
- jsdom: portada y ficha muestran «Desde», modalidad/zona/incluye/opciones; JSON-LD `AggregateOffer`; el admin recarga y reserializa los datos sin pérdidas y avisa de líneas de opciones mal escritas. Catálogo y landing locales restaurados.
- Nota: `wrangler pages dev` se cayó una vez por `SQLITE_BUSY` al recargar durante ediciones; reiniciar `npm run dev` lo resuelve.

## 2026-10-29 — Fase 3: identidad y confianza
- Hallazgo: `landing.secciones` no se pintaba en ninguna página pública. Ahora `index.html` renderiza texto, destacados, galería, contacto, sobre-mi y testimonios (todo con `textContent`, sin HTML inyectado).
- Node: 11 casos (acento claro/oscuro/no hex, landing antigua con colores, testimonios válidos/inválidos, contenido >2000, id reservado).
- Servidor real: PUT landing con acento `#ffd400` + secciones nuevas -> 200; upload de `sobre-mi` -> 200 y `GET /api/image?id=sobre-mi` -> 200; `<style>:root{--accent:#ffd400}</style>` en `/` y `/faq`; jsdom confirma las 6 secciones, foto, enlace, 2 testimonios, cards de destacados, galería y botones de contacto.
- Admin (jsdom): ida y vuelta exacta de secciones y testimonios, aviso de contraste (12.7:1 vs 1.1:1), «Sobre mí» listado en Fotos. Landing y foto locales restauradas.
- Pendiente: revisión visual a 375px/escritorio en navegador real (no hay Chrome en esta máquina).

## 2026-10-29 — Fase 4: reserva genérica y analítica
- `reserva_url` (config e items) sustituye a `calendly_url`; datos antiguos se siguen leyendo y el admin los migra al guardar. Node: 11 casos (token con inyección rechazado, reserva sin protocolo, datos antiguos válidos).
- Servidor real: token inválido -> 400; token válido -> beacon en `/`, `/faq`, `/producto?id=…`, ausente en `/carrito` y en 404; ficha de servicio usa `https://cal.com/...` y, con la config antigua restaurada, `calendly_url` sigue funcionando; admin Identidad migra el campo y solo guarda `analitica` si hay token.
- jsdom no pudo cargar `static.cloudflareinsights.com` (sin red en el sandbox): la presencia del `<script>` está verificada, la carga real del beacon no.

## 2026-10-29 — Fase 5: seguridad y calidad
- `npm test`: 17 pruebas (Node `--test`) pasan; una mutación (contraste mínimo 4.5→1) hace fallar la prueba de acento, y revertida vuelve a 17/17.
- Login real: 5 fallos -> 401; el 6.º y un intento con contraseña correcta -> 429 con `Retry-After`; tras borrar `intentos:127.0.0.1` del KV local el login correcto devuelve 200. En local la IP es `127.0.0.1`.
- No probado en runtime: el `aviso` de contraseña corta (la local tiene 20 caracteres; solo revisado por lectura).
- Eliminados `validate-phase*.sh` y `test-all-phases.sh`. `package.json` gana `"type": "module"` y `"test"`.

## 2026-10-29 — Editor de Landing por pestañas
- jsdom contra `npm run dev`: sin tocar nada, `obtenerLanding()` devuelve exactamente los datos guardados; pestañas con roles ARIA y flechas/Inicio/Fin; marcar items, renombrar (la pestaña se actualiza), añadir sección desde el selector de tipo (6 opciones), testimonios en tarjetas, subir, eliminar y guardar real (200). Item inexistente: fila en rojo y, al guardar, el error del servidor se muestra completo. Landing local restaurada.
- Corregido de paso: `admin.putContent` solo mostraba «JSON inválido»; ahora muestra `detalle` (afecta a todos los formularios del admin).
- Pendiente: revisión visual a 375px (pestañas con scroll horizontal) en navegador real.

## 2026-10-29 — Editor de opciones de precio en Catálogo
- Las opciones de precio pasan de un textarea con `|` a filas (nombre, precio, minutos opcional) con «+ Añadir opción» (máx. 6) y «Quitar».
- jsdom contra `npm run dev`: carga las 2 opciones guardadas; la salida de `obtenerCatalogo()` es igual al original salvo `calendly_url` → `reserva_url` (migración esperada); fila vacía ignorada; opción nueva (`45.5`, 90 min) leída; precio negativo y nombre vacío dan error específico en español; el botón se deshabilita en 6 filas; quitar devuelve el foco al botón de añadir; un producto no lleva `variantes`; guardado real 200. Catálogo local restaurado.
- jsdom descarta la coma decimal en `<input type=number>`, por eso la prueba usó punto; el código acepta también coma.
- Pendiente: revisión visual a 375px en navegador real.

## 2026-10-29 — Posición de secciones y orden del menú del admin
- `secciones[].posicion` (`antes|despues`): 18 pruebas Node pasan (nueva: valor inválido rechazado). Servidor: `posicion: 'arriba'` -> 400 en español; `antes` -> 200; la portada queda `hero > secciones-antes > catalogo > secciones-landing`. jsdom: el editor muestra el selector (defecto «Después del catálogo»), la ida y vuelta conserva `posicion` y la clave se omite cuando es `despues`. Landing local restaurada.
- Menú del admin: General · Landing · Catálogo · Fotos · FAQ · Respaldo (la URL sigue siendo `/admin/identidad`).
- Pendiente: revisión visual a 375px y en escritorio.
