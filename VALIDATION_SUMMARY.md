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
| Sintaxis de JS de `functions/` y `public/assets/` | `node --check` OK |
| Sintaxis de scripts inline de los HTML | `node --check` OK |

## Estado local

- KV local: `config`, `catalogo`, `landing` y `faq` sembradas en `.wrangler/state`.
- R2 local: `items/pan-integral.png` subido durante las pruebas.
- `wrangler.toml`: `[ai]` comentado; `/api/chat` responde 503.
- `ADMIN_PASSWORD` vive en `.dev.vars`; no se imprime ni se versiona.

## No verificado todavía

- Interacción real en navegador: guardar formularios del admin, subir foto desde `fotos.html`, carrito, WhatsApp y Calendly.
- Diseño a 375px y escritorio.
- Chat con Workers AI (requiere descomentar `[ai]` y `npx wrangler login`).
- No hay UI de chat en las páginas públicas.
- Los scripts `validate-phase*.sh` y `test-all-phases.sh` no se usaron como prueba de runtime: son greps estáticos y tienen falsos positivos/negativos.
- No hay `.git`, `npm test`, `npm run lint` ni `npm run typecheck`.
