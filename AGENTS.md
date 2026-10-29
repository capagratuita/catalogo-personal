# AGENTS.md — Catálogo Personal desplegable en Cloudflare

## 1. Estado actual (verificado 2026-10-28)

El flujo local de contenido, admin e imágenes **ya funciona** sin Cloudflare login. El chat con IA queda deshabilitado por defecto para no bloquear `npm run dev`.

- `npm run dev` arranca en `http://localhost:8788` y en la LAN (`0.0.0.0:8788`); la IP actual es `192.168.11.104` (puede cambiar, usa `hostname -I`). El script de `package.json` ya incluye `--ip 0.0.0.0 --port 8788`.
- `wrangler.toml` trae el bloque `[ai]` comentado; sin ese binding, `/api/chat` devuelve 503 con un mensaje accionable.
- Auth implementada con cookie HMAC-SHA256 (`functions/_lib/auth.js`): `/api/login`, `/api/logout`, `/api/session`; el middleware protege `/admin/*` (salvo login) y `PUT /api/content`/`POST /api/upload`.
- `functions/api/upload.js` usa `env.IMAGES.put`, valida tipo/tamaño/item, borra extensiones viejas y no contiene credenciales ni SDK de AWS.
- `functions/api/image.js` sirve las fotos desde el KV `IMAGES` por `id` o `url=items/...`; `producto.html` y `fotos.html` ya lo usan.
- `functions/api/content.js` exporta validadores, acepta nullables y refuerza slug único, categoría existente, descripción ≤200, enums, booleanos y categorías de agendamiento existentes.
- Las públicas cargan `/assets/app.js`; las admin cargan `../assets/admin.js` y usan `await window.admin.isAuthenticated()`. El CSS de admin apunta a `../assets/styles.css`.
- Existe `public/assets/images/placeholder.png`; ficha y carrito usan `config.negocio.moneda` y `formatPrecio`.
- Verificado con `npm run dev` + curl: GET de las 4 keys, login correcto/incorrecto, session, PUT autenticado, upload, image, logout, redirección de admin y acceso por IP LAN. En navegador: guardado de identidad/catálogo/landing/FAQ, subida y preview de fotos, ficha, contador del carrito y checkout por WhatsApp.
- Estado local persistido en `.wrangler/state`: las 4 keys KV están sembradas y las 5 fotos existentes están en el KV local `IMAGES` (`items/{id}.{ext}`).
- Pendiente: probar en navegador los checkboxes de `categorias_agendamiento`; revisar 375px; no hay UI de chat en las páginas públicas; `README.md` sigue desactualizado; los `validate-phase*.sh` son greps no fiables; no hay `.git`, `test`, `lint` ni `typecheck`. La memoria de trabajo está en `AGENTS_SUMMARY.md` y el log de pruebas en `VALIDATION_SUMMARY.md`.

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
| Citas | Calendly | Enlace global + override opcional por servicio |
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
14. **No avances de fase con los scripts de validación actuales**: son greps estáticos, no pruebas de runtime. Verifica con `npm run dev` y llamadas reales.

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
- No hay `npm test` ni `npm run lint`. Los `validate-phase*.sh` son greps estáticos: `validate-phase0.sh` tiene falsos negativos (por ejemplo, la comprobación del bucket R2, que ya no se usa) y patrones frágiles como `[[ai]]`; `test-all-phases.sh` usa rutas absolutas `/home/devops/...`. No los uses como prueba de que algo funciona.
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
  api/{content,defaults,login,logout,session,upload,image,chat}.js
config/*.example.json
wrangler.toml, package.json, README.md
validate-phase*.sh, test-all-phases.sh
AGENTS_SUMMARY.md, VALIDATION_SUMMARY.md
```

- `public/` es el `pages_build_output_dir`.
- `functions/api/*.js` se autodescubren como rutas; no hay `main` en `wrangler.toml`.
- Faltan `public/_headers`, `docs/` y `config/claude-prompts.md`. `public/assets/images/` ya existe. `AGENTS_SUMMARY.md` es la memoria de sesión y `VALIDATION_SUMMARY.md` el log de pruebas; ambos se actualizaron el 2026-10-28.

## 6. Contratos de datos

La referencia ejecutable son `config/*.example.json` (ejemplo: tienda de Capa Gratuita; precios, WhatsApp `+00000000000` es un marcador a reemplazar; el email es opcional y va en `null`). Las páginas públicas no llevan el nombre del negocio en el HTML: `app.js` lo rellena desde `config.negocio` (`aplicarMarca`: logo, pie, redes con `data-red`, título). Campos y límites que el validador y la UI esperan:

- `config`: `negocio` con `nombre`, `descripcion_corta`, `whatsapp`, `email` (string|null, opcional), `moneda` (ISO 4217), `modo_negocio` (`solo-productos|solo-servicios|mixto`), `calendly_url` (string|null), `logo_url` (string|null), `redes.instagram/facebook` (string|null), `tono_chat`.
- `catalogo`: `categorias` tipadas como `{ producto: [...], servicio: [...] }` e `items` (máx. 200). El array plano legacy sigue aceptándose y el admin lo migra al cargar. Cada item: `id` slug único `^[a-z0-9-]+$`, `tipo` (`producto|servicio`), `nombre`, `descripcion` (spec ≤200), `precio` número ≥0, `categoria` existente en la lista de su tipo o `""` (opcional), `disponible`/`destacado` booleanos, `duracion_minutos` número en servicios y `null` en productos, `calendly_url` string|null. `precio_a_consultar` boolean opcional, solo en servicios (el validador rechaza `true` en productos): con `true` el precio es orientativo, se muestra «Desde X» si `precio` > 0 o «Precio a consultar» si es 0, el item no entra al carrito y su botón es «Consultar por WhatsApp» (`buildCotizacionLink`, con nombre y duración estimada); tiene prioridad sobre Calendly. `categorias_agendamiento` es un array opcional de categorías de servicio; solo los servicios de esas categorías usan Calendly. Si falta el campo, el admin infiere `cita`/`citas` al cargar y las páginas públicas no marcan ninguna. El panel del admin solo lista categorías de servicio y guarda únicamente esas.
- `landing`: `hero{titulo,subtitulo,cta_texto,cta_enlace,imagen_fondo_url}`, `secciones[]` con `tipo` (`texto|destacados|galeria|contacto`), `titulo`, `contenido`, `items_ids`; `tema{color_primario,color_secundario,fuente,estilo}`; `seo{titulo,descripcion}`.
- `faq`: `preguntas[{p,r}]` (máx. 15) y `tono`.

El validador ya comprueba unicidad de `id`, existencia de `categoria` en la lista de su tipo (salvo `""`), longitud de `descripcion`, enums de `modo_negocio`/`fuente`/`estilo`, booleanos y que `categorias_agendamiento` solo contenga categorías de servicio. Aún no valida URLs/email ni que `landing.secciones[].items_ids` existan en el catálogo; si tocas `content.js`, añade esas reglas y pruebas.

## 7. API y autenticación

| Ruta | Auth | Contrato |
|---|---|---|
| `GET /api/content?key=...` | pública | 200 JSON; 404 si no existe; keys `config`, `catalogo`, `landing`, `faq`. |
| `PUT /api/content?key=...` | cookie `admin_session` | Valida schema y hace `KV.put`; 200 `{ok,updated_at}`; 400 `{error,detalle}`; 401. |
| `POST /api/login` | pública | Body `{password}`; 200 `{ok:true}` + `Set-Cookie`; 401. |
| `POST /api/logout` | cookie | 200 `{ok:true}`; borra la cookie. |
| `GET /api/session` | cookie | 200 `{authenticated:true}`; 401 si no hay sesión válida. |
| `POST /api/upload` | cookie `admin_session` | `multipart/form-data` con `id` y `file`; ≤5 MB; JPEG/PNG/WebP; item debe existir; guarda `items/{id}.{ext}` y borra extensiones viejas. |
| `GET /api/defaults?key=...` | pública | 200 con el `config/*.example.json` de esa key (importado en el bundle); 400 si la key no es válida. Solo lectura: no escribe en KV. |
| `GET /api/image?id=...` o `?url=items/...` | pública | 200 imagen desde KV; 404 si no existe o el id es inválido. |
| `POST /api/chat` | pública | Body `{question}`; 200 `{answer}`; 400 pregunta vacía; 429 límite; 503 si falta el binding `AI`. |

- Cookie esperada: `admin_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`.
- Implementado en `functions/_lib/auth.js`: cookie firmada con HMAC-SHA256 usando `ADMIN_PASSWORD` como secreto; el middleware verifica `/admin/*` (excepto `/admin`, `/admin/` y `/admin/index.html`) y las escrituras. No hay sesiones en KV.
- `window.admin.isAuthenticated()` es asíncrona; en las páginas admin debe usarse con `await`.
- **Tarjeta vs. ficha:** la tarjeta de la portada es un resumen (foto, nombre, precio, duración y una acción; los servicios añaden la descripción cortada a 2 líneas, los productos no); la foto y el nombre llevan a la ficha (`producto.html`), que es la única que muestra la descripción completa, la categoría y el tipo. El precio, la duración y el botón van siempre pegados al fondo de la tarjeta (`.item-meta` con `margin-top: auto`), para que se alineen aunque el título ocupe una o dos líneas. Al pasar el cursor sobre la foto aparece «Ver detalles». No repitas en la tarjeta lo que ya está en la ficha.
- **Servicios a cotizar:** `app.js` expone `requiereCotizacion`, `textoPrecio` y `buildCotizacionLink`. Las tarjetas muestran el precio también en servicios. El admin de Catálogo tiene la casilla «Precio a consultar» (solo se habilita en servicios).
- **CTA del hero:** es un solo botón (`landing.hero.cta_texto/cta_enlace`). El ejemplo apunta a `/#seccion-servicio`, porque en un negocio mixto los productos ya quedan a la vista bajo el hero. `ajustarCta()` en `index.html` lo oculta si el destino `#...` no existe o está oculto (p. ej. solo-productos).
- **Sitio recién desplegado:** `app.js` (`loadCatalogo/loadConfig/loadLanding/loadFAQ`, memoizadas) cae a `/api/defaults` cuando la key no existe en KV, así las páginas públicas muestran los ejemplos sin guardar nada. En cuanto el admin guarda una key, se usa la guardada.
- **Paleta:** `styles.css` define la paleta de Capa Gratuita como variables (`--primary` #12161C, `--accent` #B6F23C, `--bg`, `--ink`, `--ok`…). La paleta es **fija**: ningún dato guardado la cambia. `landing.tema.color_primario/color_secundario` siguen en el esquema (el validador los exige) pero se ignoran; el admin ya no los muestra y guarda `#12161c`/`#b6f23c`. `landing.tema.fuente` sí se aplica (`aplicarTema`); `estilo` no. No hardcodees colores de marca: usa las variables.
- **Primer arranque sin terminal:** si una key no existe en KV, `admin.getContent` cae a `/api/defaults` y muestra un aviso de datos de ejemplo; no se guarda nada hasta que el admin pulse Guardar (`PUT /api/content`). `admin/respaldo.html` exporta/importa las 4 keys en un solo JSON (las fotos no van incluidas; se suben desde `fotos.html`). `admin.js` inyecta la barra de navegación del admin. Pages sirve `/admin/identidad` sin `.html`.

## 8. Convenciones de frontend

- Cada página es HTML completo. Las públicas cargan `/assets/app.js`; las admin cargan `../assets/admin.js` antes de su script inline.
- El admin separa las categorías en pestañas Productos y Servicios; cada categoría nace con su tipo y los selectores de categoría de cada item se filtran por el tipo del item.
- `assets/app.js` expone `window.app`: `fetchJSON`, `loadCatalogo`, `loadConfig` (memoizada), `aplicarMarca`, `loadLanding`, `loadFAQ`, `renderItem`, `buildWhatsAppLink`, `formatPrecio`, `getCarrito`, `saveCarrito`, `addToCarrito`, `getCarritoTotal`, `getCarritoItemsCount`.
- `assets/admin.js` expone `window.admin`: `login`, `isAuthenticated` (async), `getContent`, `putContent`, `exportarTodo`, `importarTodo`, `logout` (async). No expone `getToken`; la sesión viaja en cookie.
- Carrito real en `localStorage` bajo `carrito`: `[{id, nombre, precio, moneda, cantidad}]` (no solo `{id,cantidad}`; la UI lee nombre/precio). El checkout arma el mensaje con nombre, cantidad, precio y total.
- WhatsApp: `https://wa.me/{config.negocio.whatsapp}?text=${encodeURIComponent(mensaje)}`.
- `producto.html` y `carrito.html` usan `config.negocio.moneda`/`formatPrecio`; si agregas precios nuevos, no hardcodees `PEN` ni `S/.`.
- `modo_negocio` controla visibilidad del carrito: con `solo-servicios`, los productos no se muestran en el carrito. Un servicio con `categoria` incluida en `categorias_agendamiento` y URL de Calendly propia o global muestra solo “Reservar Cita” (sin carrito). Un servicio no agendable, o agendable sin URL, muestra “Añadir al Carrito”. Los productos nunca muestran Calendly. `requiereAgendamiento(item, catalogo)` en `app.js` centraliza la regla.

## 9. Imágenes (KV `IMAGES`)

- La convención es `items/{id}.{ext}` y el item debe existir en `catalogo`: el guardado en KV o, mientras no se haya guardado ninguno, el de ejemplo (`functions/_lib/defaults.js`, `getContent`). Al guardar un catálogo propio, solo valen sus IDs.
- Usa el binding: `await env.IMAGES.put(key, body, { metadata: { contentType: file.type } })` y lee con `getWithMetadata(key, { type: 'arrayBuffer' })`. Límites del KV gratuito: 1 GB, 1.000 escrituras/día, 100.000 lecturas/día, 25 MiB por valor (el tope de subida es 5 MB). Una foto nueva puede tardar hasta ~60 s en verse en otros puntos de la red (consistencia eventual).
- `GET /api/image?id={id}` busca `items/{id}.jpg|jpeg|png|webp`; `GET /api/image?url=items/{id}.{ext}` sirve una key exacta. La ruta es pública y cachea 1 hora.
- Al subir una imagen se borran las otras extensiones del mismo `id` para evitar servir una foto vieja.
- Tamaño recomendado: 1200×900 px (4:3), WebP o JPEG de ~200–300 KB; el sistema no redimensiona. La portada muestra la foto en cada tarjeta (`.item-imagen`, 4:3, `object-fit: cover`) y cae a `assets/images/placeholder.png` si `/api/image` responde 404; la ficha usa un recuadro de 400px (300px en móvil).
- No hay campo `imagen_url` en el catálogo: la URL se construye desde `id`. `fotos.html` muestra la URL resultante, pero no la guarda; la ficha usa `/api/image?id=...`.
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

- Añadir UI de chat en las páginas públicas y decidir si el binding `[ai]` se activa por defecto.
- Actualizar `README.md` cuando el flujo con chat esté cerrado.

**Fases pendientes:**

- Fase 4: faltan `config/claude-prompts.md`, `docs/guia-paso-a-paso.md` y `docs/video-script.md`. Al crear los prompts, exige JSON puro y las reglas de la sección 6.
- Fase 5: faltan `docs/e2e-checklist.md`, `docs/friction-log.md` y un README definitivo.
- No marques una fase como completa por los scripts `validate-phase*.sh`; usan greps y tienen falsos positivos/negativos.

## 11. Criterios de aceptación

- Un fork limpio arranca en local con `npm run dev`; para desplegar, configura los dos namespaces KV y autentica Wrangler.
- No hay tokens ni credenciales en el repo.
- Flujo local: login -> editar config/catálogo/landing/faq -> subir foto -> ver en ficha -> carrito -> WhatsApp -> Calendly. El chat requiere descomentar `[ai]` y `npx wrangler login`.
- 375px y desktop; errores en español con mensaje accionable.
- El sistema funciona en la capa gratuita de Cloudflare.

## 12. Al trabajar en este repo

- Lee la sección 1 antes de asumir que algo funciona.
- Si tocas `wrangler.toml` o el script `dev`, respeta las reglas 11 y 12.
- No reactives `[ai]` sin `npx wrangler login`; en entornos no interactivos usa `CLOUDFLARE_API_TOKEN` o deja el bloque comentado.
- Si necesitas D1, tokens o commits automáticos, detente y pregunta.
- Mantén `AGENTS.md`, `AGENTS_SUMMARY.md` y `VALIDATION_SUMMARY.md` sincronizados con el estado real; no actualices `README.md` hasta que el flujo con chat esté cerrado.

## 13. Continuar pruebas en otra sesión

- La memoria de trabajo está en `AGENTS_SUMMARY.md` y el log de pruebas en `VALIDATION_SUMMARY.md`.
- Estado de partida: `npm run dev` escucha en `0.0.0.0:8788`; LAN `http://192.168.11.104:8788` (la IP puede cambiar; usa `hostname -I`). Las 4 keys KV están sembradas y el KV local `IMAGES` tiene las 5 fotos.
- Para retomar: `cd /home/devops/proyectos/personal-ecommerce`, libera el puerto con `lsof -t -iTCP:8788 -sTCP:LISTEN | xargs -r kill`, ejecuta `npm run dev` y abre `http://localhost:8788` o la IP LAN.
- Si `.wrangler/state` se borra, vuelve a sembrar KV con los comandos de la sección 4.
- Pruebas pendientes: checkboxes de `categorias_agendamiento` (servicio agendable oculta carrito), 375px/escritorio, decidir UI de chat y actualizar `README.md`.
- `[ai]` sigue comentado: para probar chat, descomenta el bloque en `wrangler.toml` y ejecuta `npx wrangler login`; sin eso `/api/chat` devuelve 503.
