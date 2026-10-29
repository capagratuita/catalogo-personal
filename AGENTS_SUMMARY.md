# Memoria de sesión — Catálogo Personal

**Fecha:** 2026-10-29
**Ruta:** `/Users/guillermo/Capa Gratuita/personal-ecommerce`
**Objetivo:** continuar sin repetir el diagnóstico. Detalle técnico en `AGENTS.md`; log de pruebas en `VALIDATION_SUMMARY.md`.

## Qué se hizo (plan de 6 fases, tras el análisis de posicionamiento)

1. **Servicios sin carrito:** `accionItem` en `app.js` decide una sola acción por oferta; el carrito se oculta en `solo-servicios`.
2. **Modelo de servicio:** `modalidad`, `zona`, `incluye`, `variantes`; validadores en `functions/_lib/validadores.js` (módulo puro) con email/URLs y `items_ids`.
3. **Identidad y confianza:** `landing.secciones` ahora se pinta (antes no se mostraba); secciones `sobre-mi` y `testimonios`; `color_acento` con contraste AA; foto de «Sobre mí» con id reservado.
4. **Reserva genérica y analítica:** `reserva_url` (lee `calendly_url` antiguo); token de Cloudflare Web Analytics.
5. **Seguridad y calidad:** límite de intentos de login; `npm test` (hoy 21 pruebas); se eliminaron `validate-phase*.sh`.
6. **Documentación:** `docs/guia-paso-a-paso.md`, `README.md`, `docs/e2e-checklist.md`, `docs/friction-log.md`.

## Reorientación a catálogo personal (2026-10-29)

- El producto es un catálogo de uso personal (profesional, emprendimiento, hobby), no un ecommerce: se cambiaron textos del admin, `README.md` y la guía («negocio», «cliente», «pedido» → lenguaje de catálogo/consulta).
- General del admin: «Modo del Negocio» pasó a **«Tipo de catálogo»**, con «Solo servicios» primero y como valor por defecto del formulario. `config/config.example.json` sigue en `mixto` a propósito (con `solo-servicios` los productos de ejemplo quedarían sin acción).
- Refactor de datos: `config.negocio` → **`config.perfil`** y `modo_negocio` → **`tipo_catalogo`**. `normalizarConfig` (`functions/_lib/validadores.js`) traduce los datos antiguos al leer (`getContent`, `GET /api/content`) y al guardar (`PUT /api/content`), así que el KV existente y los respaldos viejos siguen funcionando sin migrar.
- Redes: `perfil.redes.tiktok` y `perfil.redes.youtube` (opcionales; admin, pie de las 4 páginas públicas y `sameAs` del JSON-LD).
- «Tono del Chat» se quitó de General; `perfil.tono_chat` sigue en los datos (el validador lo exige y el chat opcional lo usa) y se conserva al guardar.
- Commits: `5f9c869` (refactor y textos), `5ae4b36` (redes y tono del chat).

## Admin de Portada: pestañas en dos niveles (2026-10-29)

- `admin/landing.html`: selector de nivel 1 `Portada | Apariencia y SEO | Secciones (n)` (ancho completo, sin scroll en móvil). Dentro de «Secciones» hay una cabecera fija con «+ Añadir sección» (antes estaba al final de la cinta, oculto en móvil) y una cinta de nivel 2 con una pestaña por sección.
- La cinta de secciones no muestra scroll vertical (`overflow-y: hidden`) y la pestaña lleva solo el nombre, sin el tipo. «Secciones» abre la última sección vista; sin secciones muestra un aviso; al eliminar una sección se vuelve a «Secciones». Las flechas/Inicio/Fin navegan dentro de cada fila.
- El tipo `texto` se llama ahora **«Mensaje»** en el admin (desplegable, selector de alta, encabezado, título propuesto y etiqueta del campo). El valor guardado sigue siendo `texto`.
- Commits: `e53827a`, `cf6cdab`, `6e2bd96`, `3ea1c0a`.
- **Arte de las secciones de la portada pública** (`44e4992`): línea de acento bajo cada título; título y texto siempre centrados en `texto`/`sobre-mi`/`contacto` (se quitó la alineación a la izquierda y el cambio de layout de `sobre-mi` a 768px, que hacía que cambiara de alineación según el ancho); `contacto` centrado (antes texto a la izquierda y botones centrados) con botones iguales en móvil; `sobre-mi` con marco de acento e iniciales si no hay foto; `testimonios` con comilla, avatar de iniciales y deslizables en móvil. Revisado en Chromium a 375px y 1200px en los 4 estilos (cambiando `data-estilo` en el navegador). Correcciones tras la revisión: frase introductoria de `destacados`/`galeria` centrada (solo `.container > p`, no las descripciones de tarjetas) y barra de `rustico` sin mezclarse con su doble línea . Pendiente: títulos largos en `elegante` (mayúsculas) a 375px.
- **«Sobre mí» con foto real** (2026-10-29): probada subiendo una foto del catálogo local (819×1024 y 600×800) por el editor, en los 4 estilos a 375px y 1000px: círculo recortado sin deformar, centrado, marco de acento y firma bien; sin errores de consola. Foto de prueba borrada del KV local. Pendiente: un retrato real, porque el recorte circular centra la foto y podría cortar una cara muy alta (opción: `object-position: center 25%`).
- Sin probar en navegador real (ni en 375px).
- **Foto de «Sobre mí» desde la sección:** el editor de la sección tiene «Tu foto» (vista previa circular, selector y «Subir foto»). Sube al momento por `/api/upload` con id `sobre-mi` (no depende de «Guardar Portada»). Probado en Chromium a 375px; la foto de prueba se borró del KV local. No hay botón para quitar la foto (no existe endpoint de borrado).
- **Campo «Tu nombre» en `sobre-mi`** (`secciones[].nombre`, ≤60, solo ese tipo; validador, editor y 3 pruebas nuevas): se muestra como firma y de él salen las iniciales sin foto. Antes las iniciales salían de `perfil.nombre` (nombre del negocio) y no coincidían con la persona; sin nombre y sin foto ahora solo se ve el texto. Probado en Chromium: con nombre → «LP» + firma; vacío → sin círculo.
- **Datos de prueba:** el KV local `landing` tiene una portada ficticia con los 6 tipos (Mensaje con `posicion: antes`, Destacados, Galería, Sobre mí, Testimonios con 3 opiniones inventadas, Contacto) sobre el catálogo de panadería. Solo está en `.wrangler/state`; `landing.example.json` sigue sin testimonios a propósito. Pasa `validateLanding`.

## Estado y pendientes

- Todo está commiteado en `main`.
- Las pruebas de UI se hicieron con jsdom contra `npm run dev`; no hay Chrome en esta máquina. Falta pasar `docs/e2e-checklist.md` en un navegador real a 375px.
- El despliegue real en Cloudflare con la guía **no se ha probado**. Falta una persona ajena que la siga (`docs/friction-log.md`).
- Pendiente de la reorientación: la barra del admin sigue diciendo «Landing»; `identidad.html` conserva su nombre de archivo; la reorientación no se revisó a ojo en navegador.
- `[ai]` sigue comentado; el chat no tiene UI.
- El KV local tiene un catálogo de panadería de pruebas (no el de ejemplo) y la clave `intentos:127.0.0.1` se borró tras probar el bloqueo.

## Cómo retomar

```bash
cd "/Users/guillermo/Capa Gratuita/personal-ecommerce"
lsof -t -iTCP:8788 -sTCP:LISTEN | xargs -r kill
npm run dev      # si cae con SQLITE_BUSY tras editar archivos, reiniciarlo
npm test
```

Si `.wrangler/state` se borra, volver a sembrar KV:

```bash
npx wrangler kv key put --binding=KV --local config   --path=config/config.example.json
npx wrangler kv key put --binding=KV --local catalogo --path=config/catalogo.example.json
npx wrangler kv key put --binding=KV --local landing  --path=config/landing.example.json
npx wrangler kv key put --binding=KV --local faq      --path=config/faq.example.json
```

En local, si bloqueas tu propia IP con contraseñas incorrectas: `npx wrangler kv key delete --binding=KV --local "intentos:127.0.0.1"`.
