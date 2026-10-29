# AGENTS.md — Catálogo Personal desplegable en Cloudflare

## 1. Estado actual (verificado 2026-10-29)

El producto está orientado a **servicios de profesionales independientes y emprendedores**; los productos son un extra. El flujo local funciona sin Cloudflare login y el chat con IA queda deshabilitado por defecto.

- `npm run dev` arranca en `http://localhost:8788` y en la LAN (`0.0.0.0:8788`). `npm test` ejecuta 20 pruebas de Node (validadores, límite de intentos, acciones del frontend).
- `wrangler.toml` trae el bloque `[ai]` comentado; sin ese binding, `/api/chat` devuelve 503 con un mensaje accionable. Los IDs de los dos KV son los del autor: cada fork debe poner los suyos (ver `docs/guia-paso-a-paso.md`).
- Auth con cookie HMAC-SHA256 (`functions/_lib/auth.js`) y límite de 5 fallos / 15 min por IP en `/api/login` (`_lib/intentos.js`). El middleware protege `/admin/*` (salvo login) y `PUT /api/content`/`POST /api/upload`.
- Los servicios no usan carrito: una sola acción (cotizar, reservar o consultar por WhatsApp). El carrito es solo de productos y se oculta en `solo-servicios` (sección 8).
- Servicios con modalidad, zona, qué incluye y variantes de precio; reserva genérica (`reserva_url`); `landing.secciones` se pinta en la portada (incluye `sobre-mi` y `testimonios`); color de acento configurable con contraste AA; analítica opcional (Cloudflare Web Analytics).
- Estado local persistido en `.wrangler/state` (el KV local actual contiene un catálogo de panadería de pruebas, no el de ejemplo). La foto de ejemplo `sobre-mi` se borró del KV local.
- Verificado en esta sesión con `npm run dev`, curl y jsdom (no hay navegador real en la máquina de desarrollo). Detalle en `VALIDATION_SUMMARY.md`.
- Pendiente: revisión visual completa en navegador real (`docs/e2e-checklist.md`; en esta sesión se revisó con Chromium de Playwright la portada en los 4 estilos y los editores del admin a 375px); probar el despliegue real en Cloudflare con una persona ajena (`docs/friction-log.md`); no hay UI de chat; no hay `lint` ni `typecheck`.

## 2. Contexto y stack (cerrado)

Template para que una persona sin terminal haga fork y despliegue su propia instancia en Cloudflare. **No es SaaS multi-inquilino.**

| Capa | Servicio | Rol |
|---|---|---|
| Frontend | Cloudflare Pages (estáticos) | Landing, catálogo, ficha, carrito, FAQ, admin |
| API | Pages Functions | Endpoints `/api/*` |
| Contenido | Workers KV | Keys exactas: `config`, `catalogo`, `landing`, `faq` |
| Imágenes | Workers KV (namespace separado, binding `IMAGES`) | Convención `items/{id}.{ext}`; R2 descartado porque exige método de pago |
| Chat | Workers AI (binding `AI`) | RAG ligero con catálogo + FAQ |
| Auth admin | `ADMIN_PASSWORD` | Protege `/admin/*` y escrituras en `/api/*` |
| Citas | Enlace de reserva (Calendly, Cal.com, Google Calendar…) | Enlace global + override opcional por servicio |
| WhatsApp | `wa.me` | Enlaces generados en cliente |
| Carrito | `localStorage` | Estado efímero, sin servidor |

Bindings:

| Binding | Local | Producción |
|---|---|---|
| `env.KV` | KV local automático | Namespace KV real |
| `env.IMAGES` | KV local automático | Segundo namespace KV real (`catalogo-fotos-kv`) |
| `env.AI` | Comentado por defecto; si se activa, es **remoto** y requiere `npx wrangler login` | Binding AI |
| `env.ADMIN_PASSWORD` | `.dev.vars` (gitignoreado) | Secret del dashboard |

En producción, reemplaza `id = "placeholder"` por el ID real de cada namespace KV (`KV` para contenido, `IMAGES` para fotos) en `wrangler.toml`. Para habilitar el chat, descomenta el bloque `[ai]` y su `binding = "AI"`; en local requiere `npx wrangler login`. No agregues `main`, `[site]`, `[build]`, `[vars]` ni `[[env]]` con secretos.

## 3. Reglas duras (violarlas es un bug)

1. **Solo KV, nunca D1.** Si crees que necesitas D1, detente y pregunta.
2. **Sin tokens de API ni secretos en el repo.** La única credencial es `ADMIN_PASSWORD` vía `env.ADMIN_PASSWORD`; local en `.dev.vars`, producción como Secret del dashboard. `upload.js` ya usa el binding `env.IMAGES` y no contiene credenciales.
3. **Sin commits automáticos.** El contenido vive en KV, no en el repo.
4. **Toda escritura de contenido pasa por `PUT /api/content`.** El cliente nunca hace `KV.put`.
5. **Las fotos solo se escriben desde `/api/upload`.** El cliente nunca escribe directo en el KV de imágenes. Usa el binding `env.IMAGES` (`put/getWithMetadata/delete`), no SDKs externos.
6. **Frontend vanilla**: HTML + CSS + JS. Sin React, Vue, Svelte, Alpine, HTMX ni frameworks CSS.
7. **Solo `wrangler` como devDependency.** No agregues `@aws-sdk/*` ni librerías de runtime; usa APIs nativas de Cloudflare/Web.
8. **Valida el JSON antes de `KV.put`** y devuelve `400` con detalle en español.
9. **Nombres de dominio y UI en español neutro**; funciones técnicas pueden ir en inglés.
10. **Sintaxis Pages Functions**: `export const onRequestGet/Put/Post` y `_middleware.js` con `export const onRequest`. No uses `addEventListener('fetch')` ni `export default { fetch }`.
11. **No uses `--persist`** (eliminado en Wrangler 4.x). La persistencia local es automática; si necesitas ruta, `--persist-to <dir>`.
12. **No uses sintaxis de Workers Sites** (`[site]`, `site.bucket`, `site.entry-point`). Usa `pages_build_output_dir`.
13. **Móvil primero** (375px), HTML semántico, `alt`, contraste AA y navegación por teclado en el admin.
14. **Verifica con `npm test` y con `npm run dev` + llamadas reales.** `npm test` cubre validadores, límite de intentos y la lógica de acciones del frontend (Node, sin dependencias); no sustituye la prueba en el servidor ni en el navegador.

## 4. Comandos y setup local

```bash
npm install
npm run dev        # http://localhost:8788 y LAN 0.0.0.0:8788; sin AI por defecto
npm run deploy     # wrangler pages deploy public
```

- Para abrir desde otro dispositivo: `hostname -I | awk '{print $1}'` y visita `http://<IP>:8788`; si no conecta, permite el puerto `8788` en el firewall.
- `env.KV` y `env.IMAGES` funcionan en local sin login.
- `env.AI` está comentado en `wrangler.toml`. Para probar el chat, descomenta `[ai]`/`binding = "AI"` y ejecuta `npx wrangler login`; en entornos no interactivos necesitas `CLOUDFLARE_API_TOKEN` o el arranque falla al conectar el binding remoto.
- `npm run deploy` también requiere autenticación de Wrangler (`npx wrangler login`); no agregues tokens al repo. Si quieres chat en producción, descomenta `[ai]` antes de desplegar.
- Sembrar KV local (las keys deben ser exactamente `config`, `catalogo`, `landing`, `faq`):

```bash
npx wrangler kv key put --binding=KV --local config   --path=config/config.example.json
npx wrangler kv key put --binding=KV --local catalogo --path=config/catalogo.example.json
npx wrangler kv key put --binding=KV --local landing  --path=config/landing.example.json
npx wrangler kv key put --binding=KV --local faq      --path=config/faq.example.json
npx wrangler kv key get --binding=KV --local config
```

- Los `config/*.example.json` no se cargan solos; hay que sembrarlos y volver a sembrar tras editarlos.
- `npm test` (runner integrado de Node, sin dependencias) ejecuta `test/*.test.mjs`: validadores, límite de intentos de login y `accionItem`/`textoPrecio` de `app.js`. No hay `npm run lint` ni typecheck. Los antiguos `validate-phase*.sh` y `test-all-phases.sh` se eliminaron (eran greps no fiables).
- Verificación real ya ejecutada: `npm run dev` compila; `GET /api/content?key=config|catalogo|landing|faq` devuelve 200; `POST /api/login` setea cookie; `/api/session` con cookie devuelve 200; `PUT /api/content` autenticado devuelve 200; `POST /api/upload` devuelve 200; `GET /api/image?id=pan-integral` devuelve la imagen; `POST /api/logout` invalida la sesión; `/admin/identidad` sin cookie redirige a `/admin/index.html`.

## 5. Estructura real y entrypoints

```text
public/
  index.html, producto.html, carrito.html, faq.html   # cargan /assets/app.js
  admin/*.html                                       # cargan ../assets/admin.js
  assets/{app.js,admin.js,styles.css}
  assets/images/placeholder.png
functions/
  _middleware.js
  _lib/auth.js
  index.js, faq.js, producto.js, carrito.js     # páginas públicas con SEO y datos inyectados
  sitemap.xml.js, robots.txt.js
  _lib/{auth,defaults,cache,paginas,validadores,intentos}.js
  api/{content,defaults,login,logout,session,upload,image,chat}.js
config/*.example.json
wrangler.toml, package.json, README.md
test/*.test.mjs
AGENTS_SUMMARY.md, VALIDATION_SUMMARY.md
```

- `public/` es el `pages_build_output_dir`.
- `functions/api/*.js` se autodescubren como rutas; no hay `main` en `wrangler.toml`.
- Falta `public/_headers`. Existe `docs/` (guía, checklist E2E, registro de fricciones). `AGENTS_SUMMARY.md` es la memoria de sesión y `VALIDATION_SUMMARY.md` el log de pruebas; ambos se actualizaron el 2026-10-29.

## 6. Contratos de datos

La referencia ejecutable son `config/*.example.json` (ejemplo: tienda de Capa Gratuita; precios, WhatsApp `+00000000000` es un marcador a reemplazar; el email es opcional y va en `null`). Las páginas públicas no llevan el nombre del negocio en el HTML: `app.js` lo rellena desde `config.perfil` (`aplicarMarca`: logo, pie, redes con `data-red`, título). Campos y límites que el validador y la UI esperan:

- `config`: `perfil` (antes `negocio`; `normalizarConfig` en `validadores.js` traduce los datos antiguos al leer y al guardar) con `nombre`, `descripcion_corta`, `whatsapp` (número) y/o `whatsapp_usuario` (nombre de usuario, sin `@`; hace falta al menos uno y, si hay ambos, gana el usuario: `buildWhatsAppLink` usa `https://api.whatsapp.com/send/?text=…&username=…&type=username&app_absent=0` en vez de `wa.me`), `email` (string|null, opcional), `moneda` (ISO 4217), `tipo_catalogo` (antes `modo_negocio`) (`solo-productos|solo-servicios|mixto`), `reserva_url` (string|null, opcional; antes `calendly_url`, que se sigue leyendo), `logo_url` (string|null), `redes.instagram/facebook` (string|null), `tono_chat`. Opcional a nivel raíz: `analitica{cf_token}` (token de Cloudflare Web Analytics, 16–64 alfanuméricos; `paginaPublica` inyecta el beacon en las páginas indexables, nunca en carrito, 404 ni admin).
- `catalogo`: `categorias` tipadas como `{ producto: [...], servicio: [...] }` e `items` (máx. 200). El array plano legacy sigue aceptándose y el admin lo migra al cargar. Cada item: `id` slug único `^[a-z0-9-]+$`, `tipo` (`producto|servicio`), `nombre`, `descripcion` (spec ≤200), `precio` número ≥0, `categoria` existente en la lista de su tipo o `""` (opcional), `disponible`/`destacado` booleanos, `duracion_minutos` número en servicios y `null` en productos, `reserva_url` string|null (opcional; antes `calendly_url`). `modalidad` (`online|presencial|ambas`), `zona` (≤80), `incluye` (≤8 líneas de ≤100) y `variantes[{nombre≤60, precio≥0, duracion_minutos≥0|null}]` (≤6) son opcionales y solo para servicios (el validador los rechaza en productos); con variantes, la tarjeta y la ficha muestran «Desde» el precio más bajo y el JSON-LD usa `AggregateOffer`; el admin los edita en «Detalles del servicio» (filas con nombre, precio y minutos opcionales; botones «Añadir opción» —máx. 6— y «Quitar»; las filas vacías se ignoran y las inválidas se avisan al guardar) y fija `precio` al mínimo de las variantes. `precio_a_consultar` boolean opcional, solo en servicios (el validador rechaza `true` en productos): con `true` el precio es orientativo, se muestra «Desde X» si `precio` > 0 o «Precio a consultar» si es 0, el item no entra al carrito y su botón es «Consultar por WhatsApp» (`buildCotizacionLink`, con nombre y duración estimada); tiene prioridad sobre la reserva. `categorias_agendamiento` es un array opcional de categorías de servicio; solo los servicios de esas categorías usan el enlace de reserva (`urlReserva` en `app.js`). Si falta el campo, el admin infiere `cita`/`citas` al cargar y las páginas públicas no marcan ninguna. El panel del admin solo lista categorías de servicio y guarda únicamente esas.
- `landing`: `hero{titulo,subtitulo,cta_texto,cta_enlace,imagen_fondo_url}`, `secciones[]` con `tipo` (`texto|destacados|galeria|contacto|sobre-mi|testimonios`), `titulo`, `contenido` (≤2000), `items_ids`; `testimonios[{texto≤300, autor≤60, detalle≤80}]` (≤8, solo en `tipo: testimonios`); `nombre` (string ≤60, opcional, solo en `tipo: sobre-mi`: firma bajo la presentación y fuente de las iniciales cuando no hay foto; sin `nombre` y sin foto solo se muestra el texto); `tema{fuente,estilo,color_acento?}`; `seo{titulo,descripcion}`. El admin (`admin/landing.html`) edita con pestañas en dos niveles: un selector de nivel 1 (`Portada | Apariencia y SEO | Secciones (n)`, ancho completo, sin scroll en móvil) y, solo dentro de «Secciones», una cabecera fija con el botón «+ Añadir sección» y, debajo, una fila de nivel 2 con una pestaña por sección. «Secciones» abre la última sección vista (o la primera); sin secciones muestra un aviso vacío. Al eliminar una sección vuelve a «Secciones». Las flechas/Inicio/Fin navegan dentro de cada fila (estado en memoria `secciones`; alta con selector de tipo, subir/bajar, eliminar, casillas para `items_ids` desde el catálogo, tarjetas para testimonios, aviso de cambios sin guardar). `admin.putContent` muestra `detalle` del servidor, no solo `error`. `secciones[].posicion` (`antes|despues`, opcional, por defecto `despues`) decide si la sección va justo bajo la portada o debajo del catálogo; `index.html` pinta cada grupo en el orden guardado (`#secciones-antes`, `#secciones-landing`; `renderizarSecciones`) y las vacías no se muestran. El admin guarda `posicion` solo cuando es `antes`. `sobre-mi` usa la foto con id reservado `sobre-mi`, que se sube desde el propio editor de la sección («Tu foto»: vista previa y «Subir foto», al momento y sin pulsar Guardar; `montarFotoSobreMi` en `admin/landing.html`, con `admin.optimizarImagen` y `POST /api/upload`) o, como cualquier otra foto, desde `POST /api/upload` ( `ID_RESERVADOS` en `validadores.js` lo prohíbe en el catálogo y `/api/upload` lo acepta sin item). `contacto` añade botones de WhatsApp y correo desde `config.perfil`. El ejemplo no incluye testimonios a propósito (no inventar opiniones). **Arte de las secciones** (`index.html` + `styles.css`, bloque «Arte de las secciones»): cada `h2` lleva una línea de acento (`h2::after`); título y texto de `texto`, `sobre-mi` y `contacto` van siempre centrados, a cualquier ancho (`sobre-mi` es una columna única de 720px: foto, texto y firma; no hay cambio de layout por breakpoint); `contacto` lleva además botones del mismo ancho en móvil; `sobre-mi` pone la foto con marco desplazado de acento y, si no hay foto, un círculo con las iniciales de `secciones[].nombre` (`.sobre-mi-iniciales`; antes salían de `perfil.nombre`, que es el del negocio) y, sin nombre, solo el texto; `testimonios` usa comilla en círculo de acento (`.testimonio::before`), avatar con iniciales (`.testimonio-avatar`) y en móvil se desliza en horizontal (`scroll-snap`). Todo con variables, sin colores de marca fijos.
- `faq`: `preguntas[{p,r}]` (máx. 15) y `tono`.

El validador ya comprueba unicidad de `id`, existencia de `categoria` en la lista de su tipo (salvo `""`), longitud de `descripcion`, enums de `tipo_catalogo`/`fuente`/`estilo`, booleanos y que `categorias_agendamiento` solo contenga categorías de servicio. También valida email y URLs (`reserva_url`/`calendly_url`, `logo_url`, redes: http(s) absolutas; `logo_url` admite ruta `/…`) y, en `PUT landing`, que `items_ids` existan en el catálogo guardado (o el de ejemplo). Los validadores viven en `functions/_lib/validadores.js` (módulo puro, reexportado por `content.js`). No valida `hero.cta_enlace` ni `imagen_fondo_url`.

## 7. API y autenticación

| Ruta | Auth | Contrato |
|---|---|---|
| `GET /api/content?key=...` | pública | 200 JSON; 404 si no existe; keys `config`, `catalogo`, `landing`, `faq`. |
| `PUT /api/content?key=...` | cookie `admin_session` | Valida schema y hace `KV.put`; 200 `{ok,updated_at}`; 400 `{error,detalle}`; 401. |
| `POST /api/login` | pública | Body `{password}`; 200 `{ok:true, aviso?}` + `Set-Cookie` (`aviso` si `ADMIN_PASSWORD` tiene <12 caracteres); 401; 429 tras 5 fallos en 15 min por IP (`Retry-After`). |
| `POST /api/logout` | cookie | 200 `{ok:true}`; borra la cookie. |
| `GET /api/session` | cookie | 200 `{authenticated:true}`; 401 si no hay sesión válida. |
| `POST /api/upload` | cookie `admin_session` | `multipart/form-data` con `id` y `file`; ≤5 MB; JPEG/PNG/WebP; item debe existir; guarda `items/{id}.{ext}` y borra extensiones viejas. |
| `GET /api/defaults?key=...` | pública | 200 con el `config/*.example.json` de esa key (importado en el bundle); 400 si la key no es válida. Solo lectura: no escribe en KV. |
| `GET /api/image?id=...` o `?url=items/...` | pública | 200 imagen desde KV; 404 si no existe o el id es inválido. |
| `POST /api/chat` | pública | Body `{question}`; 200 `{answer}`; 400 pregunta vacía; 429 límite; 503 si falta el binding `AI`. |

- Cookie esperada: `admin_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`.
- Implementado en `functions/_lib/auth.js`: cookie firmada con HMAC-SHA256 usando `ADMIN_PASSWORD` como secreto; el middleware verifica `/admin/*` (excepto `/admin`, `/admin/` y `/admin/index.html`) y las escrituras. No hay sesiones en KV. Los intentos fallidos de login sí se guardan en KV (`intentos:{ip}`, TTL 15 min, `_lib/intentos.js`): solo se escribe al fallar y no se escribe más con la IP bloqueada, para no gastar las 1.000 escrituras diarias.
- `window.admin.isAuthenticated()` es asíncrona; en las páginas admin debe usarse con `await`.
- **Tarjeta vs. ficha:** la tarjeta de la portada es un resumen (foto, nombre, precio, duración y una acción; los servicios añaden la descripción cortada a 2 líneas, los productos no); **toda la tarjeta lleva a la ficha** (`producto.html`; el enlace del título se estira con `h3 a::after` y la acción queda por encima, con `pointer-events` solo en el botón), que es la única que muestra la descripción completa, la categoría y el tipo. El precio, la duración y el botón van siempre pegados al fondo de la tarjeta (`.item-meta` con `margin-top: auto`), para que se alineen aunque el título ocupe una o dos líneas. Al pasar el ratón la tarjeta sube 4 px (`--card-lift`) y aparece una sombra suave (`--shadow-hover`), como en boluda.com; ya no hay overlay «Ver detalles». Tarjetas redondeadas (`--radius-card` 20px) con fondo tenue (`--card-tint`; en blanco sobre fondos grises). No repitas en la tarjeta lo que ya está en la ficha.
- **Compartir:** la ficha lleva una línea discreta «Compartir: WhatsApp · Copiar enlace» (`prepararCompartir` en `producto.html`; `wa.me/?text=` con nombre y URL, y copia al portapapeles). No va en las tarjetas ni como botón.
- **Servicios a cotizar:** `app.js` expone `requiereCotizacion`, `textoPrecio` y `buildCotizacionLink`. Las tarjetas muestran el precio también en servicios. El admin de Catálogo tiene la casilla «Precio a consultar» (solo se habilita en servicios).
- **CTA del hero:** es un solo botón (`landing.hero.cta_texto/cta_enlace`). El ejemplo apunta a `/#seccion-servicio`, porque en un negocio mixto los productos ya quedan a la vista bajo el hero. `ajustarCta()` en `index.html` lo oculta si el destino `#...` no existe o está oculto (p. ej. solo-productos).
- **Caché y límites gratuitos:** cada visita a una página pública es 1 invocación de función (la de la página) más 1 por foto; no pide `/api/content` porque `functions/_lib/paginas.js` inyecta los datos en `<script id="sitio-datos">` y `app.js` los lee de ahí (`/api/content` queda como respaldo). Las lecturas de KV pasan por la Cache API de borde 60 s (`_lib/cache.js`), se invalidan al hacer PUT/upload en ese centro de datos y las demás caducan solas; las fotos se cachean 5 min en el borde y 1 h en el navegador. La Cache API puede no aplicar en `*.pages.dev` (sí con dominio propio); sin caché todo funciona leyendo KV. El admin lee con `cache: 'no-store'`. Los cambios pueden tardar hasta ~60 s en verse.
- **SEO y compartir:** `/`, `/faq`, `/producto?id=…` y `/carrito` pasan por `paginaPublica()`, que inyecta título, descripción, canonical, Open Graph/Twitter y JSON-LD (WebSite+Organization, FAQPage, Product/Service). `og:image` es la foto del item (si existe) o `negocio.logo_url`; si no hay ninguna, sin imagen. Un id inexistente responde 404 con `noindex`; el carrito y el admin llevan `noindex`. `/sitemap.xml` (home, FAQ y cada item) y `/robots.txt` son dinámicos. Para que la vista previa de WhatsApp muestre la foto, mantenla ligera (≲300 KB).
- **Sitio recién desplegado:** `app.js` (`loadCatalogo/loadConfig/loadLanding/loadFAQ`, memoizadas) cae a `/api/defaults` cuando la key no existe en KV, así las páginas públicas muestran los ejemplos sin guardar nada. En cuanto el admin guarda una key, se usa la guardada.
- **Diseño visual (rediseño 2026-10-29):** referencia de limpieza: fondo blanco, mucho aire, una sola tipografía, bordes finos y sin sombras. `--bg` es blanco y `--bg-alt` (#F6F7F9) alterna secciones; el hero es claro y centrado (con `imagen_fondo_url` pasa a texto blanco vía la clase `hero-imagen`); cada tarjeta lleva **una sola acción** con botón blanco de borde fino (se oscurece al pasar el cursor) y la acción principal de la página (hero, ficha, carrito, contacto) usa el acento relleno. La tipografía es **Inter variable alojada en `public/assets/fonts/`** (latin, 48 KB, licencia OFL en `Inter-OFL.txt`; precargada en las 4 páginas públicas; `FUENTES.sans` de `app.js` la pone primero). Sin emojis como iconos: el carrito de la navegación es un enlace (`a.carrito-icon`) con SVG y el pie usa enlaces de texto; la navegación no repite «Carrito» como enlace. `placeholder.png` es un gris neutro con icono de imagen. Texto con `text-wrap: balance`. Los campos de formulario heredan la fuente. Contrastes verificados AA (`--muted` 6.0:1 sobre blanco).
- **Paleta y acento:** `styles.css` define la paleta de Capa Gratuita como variables (`--primary` #12161C, `--accent` #B6F23C, `--bg`, `--ink`, `--ok`…). Solo el acento es configurable: `landing.tema.color_acento` (`#rrggbb`, opcional) reemplaza `--accent`. Se usa de fondo de botones con texto `--ink`, así que el validador exige contraste ≥ 4.5:1 con `#12161C` (mensaje accionable) y el admin lo avisa en vivo. El servidor lo inyecta en `<head>` (`paginas.js`) para evitar parpadeo; `app.js` (`aplicarTema`) lo repite. `color_primario/color_secundario` ya no se piden ni se guardan (se aceptan y se ignoran si vienen en datos antiguos). `landing.tema.fuente` y `landing.tema.estilo` sí se aplican. El estilo (`moderno` base, `minimalista`, `rustico`, `elegante`) cambia radios, sombras, tipografía de títulos y espaciado, nunca colores. Tarjetas: `moderno` 20px con fondo tenue y sombra al hover; `minimalista` 12px, blancas, sin sombra ni elevación; `rustico` 14px con bordes marcados y sombras sólidas; `elegante` con esquinas rectas (0px) a propósito, es su rasgo distintivo: `styles.css` usa variables (`--radius-*`, `--shadow-*`, `--font-heading`) y los tres estilos no base las sobrescriben bajo `html[data-estilo="…"]`; `paginas.js` pone el atributo en `<html>` desde el servidor y `aplicarTema` lo repite. `moderno` no lleva atributo y es la base visual limpia (ver «Diseño visual»). No hardcodees colores de marca: usa las variables.
- **Primer arranque sin terminal:** si una key no existe en KV, `admin.getContent` cae a `/api/defaults` y muestra un aviso de datos de ejemplo; no se guarda nada hasta que el admin pulse Guardar (`PUT /api/content`). `admin/respaldo.html` exporta/importa las 4 keys en un solo JSON (las fotos no van incluidas; se suben desde `fotos.html`). `admin.js` inyecta la barra de navegación del admin, en este orden: General (`identidad.html`, la URL no cambió), Landing, Catálogo, FAQ, Respaldo. `/admin/fotos` redirige a Catálogo (`public/_redirects`); la foto de cada item se sube desde su fila en Catálogo. Pages sirve `/admin/identidad` sin `.html`.

## 8. Convenciones de frontend

- Cada página es HTML completo. Las públicas cargan `/assets/app.js`; las admin cargan `../assets/admin.js` antes de su script inline.
- El admin separa las categorías en pestañas Productos y Servicios; cada categoría nace con su tipo y los selectores de categoría de cada item se filtran por el tipo del item.
- `assets/app.js` expone `window.app`: `fetchJSON`, `loadCatalogo`, `loadConfig` (memoizada), `aplicarMarca`, `loadLanding`, `loadFAQ`, `renderItem`, `buildWhatsAppLink`, `formatPrecio`, `getCarrito`, `saveCarrito`, `addToCarrito`, `getCarritoTotal`, `getCarritoItemsCount`.
- `assets/admin.js` expone `window.admin`: `login`, `isAuthenticated` (async), `getContent`, `putContent`, `exportarTodo`, `importarTodo`, `logout` (async). No expone `getToken`; la sesión viaja en cookie.
- Carrito real en `localStorage` bajo `carrito`: `[{id, nombre, precio, moneda, cantidad}]` (no solo `{id,cantidad}`; la UI lee nombre/precio). El checkout arma el mensaje con nombre, cantidad, precio y total.
- WhatsApp: `https://wa.me/{config.perfil.whatsapp}?text=${encodeURIComponent(mensaje)}`, o el enlace de `api.whatsapp.com` si hay `whatsapp_usuario` (siempre vía `buildWhatsAppLink`; `tieneWhatsApp` indica si hay alguno).
- `producto.html` y `carrito.html` usan `config.perfil.moneda`/`formatPrecio`; si agregas precios nuevos, no hardcodees `PEN` ni `S/.`.
- **Una sola acción por oferta** (`accionItem(item, config, catalogo)` en `app.js`): los servicios nunca van al carrito. Precio a consultar → «Consultar por WhatsApp» (cotización); categoría en `categorias_agendamiento` con enlace de reserva propio o global → «Reservar Cita»; el resto → «Consultar por WhatsApp» (disponibilidad). Los productos usan el carrito. `tipo_catalogo: solo-servicios` oculta el carrito (icono y enlaces, vía `aplicarCarrito`), y `/carrito` muestra un aviso; `carrito.html` descarta servicios que hubieran quedado en `localStorage`.

## 9. Imágenes (KV `IMAGES`)

- La convención es `items/{id}.{ext}` y el item debe existir en `catalogo`: el guardado en KV o, mientras no se haya guardado ninguno, el de ejemplo (`functions/_lib/defaults.js`, `getContent`). Al guardar un catálogo propio, solo valen sus IDs.
- Usa el binding: `await env.IMAGES.put(key, body, { metadata: { contentType: file.type } })` y lee con `getWithMetadata(key, { type: 'arrayBuffer' })`. Límites del KV gratuito: 1 GB, 1.000 escrituras/día, 100.000 lecturas/día, 25 MiB por valor (el tope de subida es 5 MB). Una foto nueva puede tardar hasta ~60 s en verse en otros puntos de la red (consistencia eventual).
- `GET /api/image?id={id}` busca `items/{id}.jpg|jpeg|png|webp`; `GET /api/image?url=items/{id}.{ext}` sirve una key exacta. La ruta es pública y cachea 1 hora.
- Al subir una imagen se borran las otras extensiones del mismo `id` para evitar servir una foto vieja.
- El admin (`catalogo.html` y `landing.html` vía `admin.subirFoto`, que usa `admin.optimizarImagen`) convierte cada foto en el navegador a **JPEG de hasta 1200 px y ~250 KB** antes de subirla (acepta originales de hasta 25 MB); el servidor no redimensiona y solo valida tipo y 5 MB. Motivo: la vista previa de WhatsApp no muestra `og:image` en WebP ni con pesos grandes (Telegram sí). Las fotos subidas antes de este cambio siguen en su formato original: hay que volver a subirlas. La portada muestra la foto en cada tarjeta (`.item-imagen`, 4:3, `object-fit: cover`) y cae a `assets/images/placeholder.png` si `/api/image` responde 404; la ficha usa un recuadro de 400px (300px en móvil).
- No hay campo `imagen_url` en el catálogo: la URL se construye desde `id`. El botón «Subir foto» de cada fila solo se activa si el `id` ya está guardado en el catálogo (`/api/upload` rechaza ids inexistentes; hay que guardar antes de subir); la ficha usa `/api/image?id=...`.
- Las fotos no tienen URL pública directa: se sirven siempre por `/api/image`. `landing.hero.imagen_fondo_url` con URLs `r2.dev` se ignora.

## 10. Reparación y roadmap

**Reparación completada:**

1. `upload.js` usa `env.IMAGES.put` (KV), sin SDK ni credenciales.
2. Auth HMAC en `_lib/auth.js`; middleware protege admin y escrituras.
3. `app.js`/`admin.js` conectados; CSS de admin y placeholder corregidos.
4. Validadores nullables y refuerzos del catálogo implementados.
5. Imagen unificada: subida -> `items/{id}.{ext}` -> `GET /api/image`.
6. KV sembrado y flujo probado con `npm run dev` + curl.

**Pendiente:**

- Decidir si el chat se elimina o se deja como extra sin UI (hoy: extra desactivado y documentado).

**Fases pendientes (plan de 6 fases, 2026-10-29):** las fases 1–5 están hechas (servicios sin carrito, modelo de servicio, identidad y confianza, reserva genérica y analítica, seguridad y calidad). La fase 6 (documentación) está escrita (`docs/guia-paso-a-paso.md`, `README.md`, `docs/e2e-checklist.md`, `docs/friction-log.md`, chat como extra opcional) pero **falta validarla con una persona ajena** y pasar el checklist en un navegador real. `config/claude-prompts.md` y `docs/video-script.md` quedan descartados salvo que se pidan.

## 11. Criterios de aceptación

- Un fork limpio arranca en local con `npm run dev`; para desplegar, configura los dos namespaces KV y autentica Wrangler.
- No hay tokens ni credenciales en el repo.
- Flujo local: login -> editar config/catálogo/landing/faq -> subir foto -> ver en ficha -> carrito (productos) / consultar o reservar (servicios) -> WhatsApp o enlace de reserva. El chat requiere descomentar `[ai]` y `npx wrangler login`.
- 375px y desktop; errores en español con mensaje accionable.
- El sistema funciona en la capa gratuita de Cloudflare.

## 12. Al trabajar en este repo

- Lee la sección 1 antes de asumir que algo funciona.
- Si tocas `wrangler.toml` o el script `dev`, respeta las reglas 11 y 12.
- No reactives `[ai]` sin `npx wrangler login`; en entornos no interactivos usa `CLOUDFLARE_API_TOKEN` o deja el bloque comentado.
- Si necesitas D1, tokens o commits automáticos, detente y pregunta.
- Mantén `AGENTS.md`, `AGENTS_SUMMARY.md` y `VALIDATION_SUMMARY.md` sincronizados con el estado real.

## 13. Continuar pruebas en otra sesión

- La memoria de trabajo está en `AGENTS_SUMMARY.md` y el log de pruebas en `VALIDATION_SUMMARY.md`.
- Estado de partida: `npm run dev` escucha en `0.0.0.0:8788`; LAN `http://192.168.11.104:8788` (la IP puede cambiar; usa `hostname -I`). Las 4 keys KV están sembradas y el KV local `IMAGES` tiene las 5 fotos.
- Para retomar: `cd /home/devops/proyectos/personal-ecommerce`, libera el puerto con `lsof -t -iTCP:8788 -sTCP:LISTEN | xargs -r kill`, ejecuta `npm run dev` y abre `http://localhost:8788` o la IP LAN.
- Si `.wrangler/state` se borra, vuelve a sembrar KV con los comandos de la sección 4.
- Pruebas pendientes: checkboxes de `categorias_agendamiento` (servicio agendable oculta carrito), 375px/escritorio, decidir UI de chat y actualizar `README.md`.
- `[ai]` sigue comentado: para probar chat, descomenta el bloque en `wrangler.toml` y ejecuta `npx wrangler login`; sin eso `/api/chat` devuelve 503.
