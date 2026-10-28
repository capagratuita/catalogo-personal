# Memoria de sesión — Catálogo Personal

**Fecha:** 2026-10-28  
**Ruta:** `/home/devops/proyectos/personal-ecommerce`  
**Objetivo:** continuar las pruebas locales en otra sesión sin repetir el diagnóstico.

## Estado verificado

- `npm run dev` escucha en `0.0.0.0:8788`: local en `http://localhost:8788` y LAN en `http://192.168.11.104:8788`. La IP puede cambiar; usa `hostname -I | awk '{print $1}'`.
- `package.json` usa `wrangler pages dev public --ip 0.0.0.0 --port 8788`.
- `wrangler.toml` tiene el bloque `[ai]` comentado. Sin ese binding, `/api/chat` devuelve 503. Para probar chat: descomenta `[ai]`/`binding = "AI"` y ejecuta `npx wrangler login`.
- KV local en `.wrangler/state`: las keys `config`, `catalogo`, `landing` y `faq` están sembradas.
- R2 local: existe `items/pan-integral.png` (placeholder de prueba subido con `/api/upload`).
- `.dev.vars` contiene `ADMIN_PASSWORD`; no imprimir el valor ni commitearlo.
- Auth implementada con cookie HMAC-SHA256 en `functions/_lib/auth.js`; middleware protege `/admin/*` (salvo login) y `PUT /api/content`/`POST /api/upload`.
- Frontend conectado: públicas cargan `/assets/app.js`; admin carga `../assets/admin.js`; CSS de admin corregido; placeholder en `public/assets/images/placeholder.png`.
- Imagen unificada: subida a `items/{id}.{ext}` y lectura con `GET /api/image?id=...`; al subir se borran extensiones viejas.
- Ficha y carrito usan `config.negocio.moneda` y `formatPrecio`.
- Categorías tipadas: `catalogo.categorias` es `{ producto: [...], servicio: [...] }`; el admin usa pestañas Productos/Servicios y filtra el selector de cada item por su tipo. El array plano legacy se migra al cargar (infiere el tipo por los items; las categorías sin uso se asignan por nombre). `PUT` sigue aceptando ambos formatos y valida que un producto no use una categoría de servicio.
- Agendamiento por categoría: `catalogo.categorias_agendamiento` (array opcional). Admin muestra checkboxes “Agendamiento con Calendly” para todas las categorías de servicio; las públicas usan `window.app.requiereAgendamiento(item, catalogo)`. Un servicio agendable con Calendly propio/global muestra solo “Reservar Cita”; el resto va al carrito. Si el campo falta, el admin infiere `cita`/`citas` y las públicas no marcan ninguna.
- `PUT /api/content?key=catalogo` rechaza con 400 una categoría de agendamiento que no exista en `categorias` (probado con curl).
- Verificado con `npm run dev` + curl: GET de las 4 keys, login correcto/incorrecto, session, PUT autenticado, upload, image, logout, redirección de admin y acceso por IP LAN.
- No hay `.git`, `npm test`, `npm run lint` ni `npm run typecheck`.
- Los `validate-phase*.sh` y `test-all-phases.sh` son greps estáticos no fiables; no los uses como prueba de runtime.
- `README.md` sigue desactualizado y no hay UI de chat en las páginas públicas.

## Cómo retomar

```bash
cd /home/devops/proyectos/personal-ecommerce
lsof -t -iTCP:8788 -sTCP:LISTEN | xargs -r kill
npm run dev
hostname -I | awk '{print $1}'
```

Abrir `http://localhost:8788` o `http://<IP-LAN>:8788`. Si otro dispositivo no conecta, permite el puerto `8788` en el firewall.

Si `.wrangler/state` se borra, volver a sembrar KV:

```bash
npx wrangler kv key put --binding=KV --local config   --path=config/config.example.json
npx wrangler kv key put --binding=KV --local catalogo --path=config/catalogo.example.json
npx wrangler kv key put --binding=KV --local landing  --path=config/landing.example.json
npx wrangler kv key put --binding=KV --local faq      --path=config/faq.example.json
```

## Pruebas rápidas con curl

```bash
BASE=http://localhost:8788
curl -sS -o /dev/null -w 'config %{http_code}\n' "$BASE/api/content?key=config"
PASS=$(awk -F= '/^ADMIN_PASSWORD=/{sub(/^ADMIN_PASSWORD=/, ""); print; exit}' .dev.vars)
jq -n --arg password "$PASS" '{password:$password}' > /tmp/login.json
curl -sS -c /tmp/cookies.txt -o /dev/null -w 'login %{http_code}\n' \
  -X POST "$BASE/api/login" -H 'Content-Type: application/json' --data-binary @/tmp/login.json
curl -sS -b /tmp/cookies.txt -o /dev/null -w 'session %{http_code}\n' "$BASE/api/session"
curl -sS -b /tmp/cookies.txt -o /dev/null -w 'PUT config %{http_code}\n' \
  -X PUT "$BASE/api/content?key=config" -H 'Content-Type: application/json' \
  --data-binary @config/config.example.json
curl -sS -b /tmp/cookies.txt -o /dev/null -w 'upload %{http_code}\n' \
  -X POST "$BASE/api/upload" \
  -F 'id=pan-integral' -F 'file=@public/assets/images/placeholder.png;type=image/png'
curl -sS -o /tmp/pan.png -w 'image %{http_code} %{content_type}\n' "$BASE/api/image?id=pan-integral"
curl -sS -b /tmp/cookies.txt -o /dev/null -w 'logout %{http_code}\n' -X POST "$BASE/api/logout"
```

Resultados esperados: `200` en config/login/session/PUT/upload/image/logout; tras logout, `/api/session` devuelve `401`; `/admin/identidad` sin cookie devuelve `302` a `/admin/index.html`.

## Checklist pendiente

- [x] Servidor local y acceso por LAN.
- [x] KV sembrado y R2 local con una imagen de prueba.
- [x] Login, session, PUT, upload, image y logout probados con curl.
- [x] Probar el admin en navegador: login, guardar identidad/catálogo/landing/FAQ y subir una foto real.
- [x] Probar ficha, carrito, checkout por WhatsApp y enlaces de Calendly.
- [ ] Probar en navegador las pestañas Productos/Servicios, la migración de categorías y los checkboxes de `categorias_agendamiento`.
- [ ] Revisar 375px y escritorio.
- [ ] Decidir si se añade UI de chat y si `[ai]` queda activo por defecto.
- [ ] Actualizar `README.md` cuando el flujo con chat esté cerrado.

## Archivos clave

- `AGENTS.md`: reglas, contratos y estado del proyecto.
- `AGENTS_SUMMARY.md`: esta memoria de sesión.
- `VALIDATION_SUMMARY.md`: log de pruebas ejecutadas.
- `package.json`: script `dev` con `--ip 0.0.0.0 --port 8788`.
- `wrangler.toml`: bindings KV/R2 y bloque `[ai]` comentado.
- `functions/_lib/auth.js`: cookie HMAC y verificación de sesión.
- `functions/_middleware.js`: protección de admin y escrituras.
- `functions/api/content.js`: validadores y KV.
- `functions/api/upload.js`: subida R2.
- `functions/api/image.js`: lectura pública de imágenes.
- `public/assets/app.js` y `public/assets/admin.js`: utilidades de frontend.
- `config/*.example.json`: seeds de KV.
