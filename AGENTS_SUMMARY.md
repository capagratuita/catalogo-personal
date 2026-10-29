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
