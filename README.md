# Mi Catálogo Digital

Template para publicar **un catálogo de tus servicios** (y, como extra, algunos productos) con tu propia dirección web, sin servidor ni costos fijos. Pensado para profesionales independientes, emprendedores y proyectos personales o de hobby.

**No es una tienda online** ni compite con Shopify o WooCommerce: no hay pasarela de pago, stock, impuestos ni envíos. Quien te visita te consulta o reserva, y el cobro lo acuerdas tú.

Cada persona hace su propio fork y despliega su propia instancia. No es un SaaS multi-inquilino.

## Qué incluye

- **Servicios:** precio fijo, «Desde X» o «Precio a consultar»; duración, modalidad (online/presencial), zona, qué incluye y opciones de precio (sesión suelta, packs).
- **Una sola acción por servicio:** «Reservar Cita» (Calendly, Cal.com, Google Calendar…) o «Consultar por WhatsApp». Los servicios no usan carrito.
- **Productos (extra):** carrito sencillo que arma una consulta por WhatsApp. Se oculta si el tipo de catálogo es «Solo servicios» (el valor por defecto).
- **Tipo de catálogo:** solo servicios, solo productos o mixto, desde General.
- **Portada editable:** portada, textos, destacados, galería, *Sobre mí* con foto, testimonios, contacto y color de acento propio.
- **FAQ**, **SEO** (título, descripción, vista previa al compartir, datos estructurados, sitemap) y analítica opcional sin cookies (Cloudflare Web Analytics).
- **Panel de administración** protegido con contraseña, con límite de intentos, respaldo y subida de fotos optimizadas.
- Frontend en HTML, CSS y JavaScript puros; todo en la capa gratuita de Cloudflare (Workers con archivos estáticos y Workers KV).

## Paquetes de inicio

En `config/paquetes/` hay tres respaldos completos listos para importar desde **Admin → Respaldo**: `solo-servicios.json`, `solo-productos.json` y `mixto.json`. Traen texto genérico («Servicio 1», «Producto 1»), FAQ, perfil y todos los tipos de sección de la portada, y los testimonios van marcados «[Ejemplo n]» (no son opiniones reales). No incluyen fotos: se suben desde Catálogo. La guía explica cómo elegir uno (sección 2.0).

## Publicar tu sitio

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/capagratuita/mi-catalogo-digital)

El botón copia el proyecto a tu GitHub, crea los dos almacenes KV y despliega el Worker. Sigue **[docs/guia-paso-a-paso.md](docs/guia-paso-a-paso.md)**: sin terminal, unos 15–30 minutos. Para traer mejoras del template después, instala una vez el workflow *Sincronizar con el template* (el botón no copia `.github/`; la guía explica cómo) y ejecútalo a mano desde la pestaña Actions.

### Notas del despliegue con el botón

- El botón **no hace fork**: copia el proyecto a tu cuenta de GitHub (historial nuevo) y crea el Worker con Workers Builds (`npm run deploy` = `wrangler deploy`). Un build creado así no se puede reintentar; para redesplegar hace falta un commit.
- El formulario pide dos nombres de KV y trae el mismo por defecto: **cámbialos a dos nombres distintos** (por ejemplo `catalogo-datos` y `catalogo-fotos`) o el despliegue falla con «title already exists». Un intento fallido deja KV sobrantes: bórralos antes de repetir.
- `ADMIN_PASSWORD` se pide en el formulario y queda guardada como secreto.
- Desactiva **Enable Preview builds**: el comando de vista previa (`wrangler preview`) falla en este proyecto. En un Worker ya creado: Settings → Builds → «Previews Base» → «Builds for Preview branches».
- La configuración debe seguir en `wrangler.jsonc` (con `wrangler.toml` el asistente no enlaza los KV) y sin `id` de KV en el repo del template.
- Si cambias el nombre del proyecto en el formulario, el asistente actualiza el repo de GitHub, `wrangler.jsonc` y `package.json`.
- Las URLs de vista previa están desactivadas (`preview_urls = false`): compartirían KV y contraseña con producción.

## Probarlo en tu computador

Requiere [Node.js](https://nodejs.org) reciente (probado con la versión 22).

```bash
npm install
cp .dev.vars.example .dev.vars   # y escribe tu clave en ADMIN_PASSWORD=
npm run dev
```

Abre `http://localhost:8788` (el panel está en `/admin`). Sin guardar nada, el sitio muestra datos de ejemplo; en local, KV se simula automáticamente y no necesitas iniciar sesión en Cloudflare.

Para abrirlo desde el celular en la misma red, usa la IP de tu computador: `http://<IP>:8788`.

Si bloqueas tu propia IP con contraseñas incorrectas (5 fallos en 15 minutos): `npx wrangler kv key delete --binding=KV --local "intentos:127.0.0.1"`. Si `npm run dev` cae con `SQLITE_BUSY_RECOVERY`: `pkill -f workerd; pkill -f wrangler` y vuelve a arrancar.

### Sembrar el KV local

Los `config/*.example.json` no se cargan solos. Si borras `.wrangler/state` (el estado local persistido), vuelve a sembrar las cuatro keys, que deben llamarse exactamente `config`, `catalogo`, `landing` y `faq`:

```bash
npx wrangler kv key put --binding=KV --local config   --path=config/config.example.json
npx wrangler kv key put --binding=KV --local catalogo --path=config/catalogo.example.json
npx wrangler kv key put --binding=KV --local landing  --path=config/landing.example.json
npx wrangler kv key put --binding=KV --local faq      --path=config/faq.example.json
```

## Pruebas

```bash
npm test                  # validadores, límite de intentos, acciones del frontend, paquetes y SEO
npm run test:integracion  # servidor real
```

`npm test` usa el runner integrado de Node, sin dependencias. `npm run test:integracion` levanta su propio `wrangler dev` en un puerto libre, con un estado temporal que borra al terminar, y prueba fichas, redirecciones, portada, JSON-LD, sitemap, cabeceras, autenticación, subida de fotos e importación de los paquetes de inicio. También puede probar un sitio ya desplegado **en solo lectura** (solo GET/HEAD; nunca inicia sesión ni escribe):

```bash
BASE_URL=https://<tu-sitio>.workers.dev npm run test:integracion
```

No hay `lint` ni `typecheck`. Nada de esto reemplaza la prueba en el navegador: usa [docs/e2e-checklist.md](docs/e2e-checklist.md).

## Cómo está hecho

Un solo Worker (`src/worker.js`) con archivos estáticos (`public/`) y dos namespaces de Workers KV. No hay base de datos ni servicios de pago.

| Capa | Servicio |
|---|---|
| Páginas | Workers Static Assets (`public/`) |
| API y páginas con SEO | Worker (`src/worker.js`, rutas en `src/`) |
| Contenido | Workers KV (`config`, `catalogo`, `landing`, `faq`) |
| Fotos | Workers KV, namespace aparte (`IMAGES`; R2 exige método de pago) |
| Acceso al panel | Cookie firmada con `ADMIN_PASSWORD` |
| Citas | Enlace de reserva (Calendly, Cal.com, Google Calendar…), global u opcional por servicio |
| WhatsApp | Enlaces `wa.me` generados en el navegador |
| Carrito | `localStorage`, sin servidor |

| Binding | Local | Producción |
|---|---|---|
| `KV` | KV local automático | Namespace KV real |
| `IMAGES` | KV local automático | Segundo namespace KV real (fotos) |
| `ADMIN_PASSWORD` | `.dev.vars` (fuera de git; plantilla en `.dev.vars.example`) | Secreto (el botón lo pide) |
| `ASSETS` | Automático | `assets.binding = "ASSETS"` en `wrangler.jsonc` |

El contenido vive en KV, no en el repositorio. Los ejemplos de `config/*.example.json` se muestran hasta que guardas tu propio contenido desde el panel. Los dos `kv_namespaces` de `wrangler.jsonc` van sin `id`: el botón o `wrangler deploy` los crean. No pongas IDs ni secretos en el repo (es público).

### Estructura

```text
public/
  index.html, producto.html, carrito.html, faq.html   # páginas públicas (cargan /assets/app.js)
  admin/*.html                                        # panel (carga ../assets/admin.js)
  assets/{app.js,admin.js,styles.css}, fonts/, images/
src/
  worker.js                                           # router: rutas → módulos, middleware, ASSETS
  _middleware.js
  index.js, faq.js, carrito.js, producto.js, producto/[id].js, servicio/[id].js   # páginas con SEO y datos inyectados
  sitemap.xml.js, robots.txt.js
  _lib/{auth,defaults,cache,paginas,validadores,intentos,seo,ficha}.js
  api/{content,defaults,login,logout,session,upload,image}.js
config/*.example.json, config/paquetes/*.json
docs/                                                 # guía, checklist E2E, registro de fricciones
test/*.test.mjs, test/integracion/
.github/workflows/sincronizar-template.yml            # manual: abre un PR con los cambios del template
wrangler.jsonc, package.json
```

Una ruta dinámica nueva se añade en las tablas de `src/worker.js` **y** en `assets.run_worker_first` de `wrangler.jsonc`.

### API

| Ruta | Acceso | Qué hace |
|---|---|---|
| `GET /api/content?key=…` | pública | Devuelve `config`, `catalogo`, `landing` o `faq` (404 si no existe). |
| `PUT /api/content?key=…` | sesión | Valida y guarda; 400 con detalle en español si hay errores. |
| `POST /api/login` | pública | `{password}`; fija la cookie `admin_session`. 429 tras 5 fallos en 15 min por IP. |
| `POST /api/logout`, `GET /api/session` | sesión | Cierra / comprueba la sesión. |
| `POST /api/upload` | sesión | Foto (JPEG/PNG/WebP, ≤5 MB) de un item o de su galería. |
| `GET /api/image?id=…` | pública | Sirve la foto desde KV. |
| `GET /api/defaults?key=…` | pública | Devuelve el ejemplo de esa key (solo lectura). |

Reglas del proyecto, contratos de datos e historial de decisiones: [AGENTS.md](AGENTS.md). Registro de pruebas: [VALIDATION_SUMMARY.md](VALIDATION_SUMMARY.md).

## Licencia

[GNU AGPL-3.0](LICENSE). Puedes usarlo y modificarlo libremente, también para tu negocio. Si publicas una versión modificada como servicio en red, debes ofrecer su código fuente a quienes lo usen, bajo la misma licencia. El nombre y el logo del proyecto no están incluidos en la licencia.
