# Registro de fricciones

Aquí se anota todo lo que le cuesta a una persona real al desplegar y usar el template. **Todavía no se ha hecho una prueba con una persona ajena ni un despliegue real en Cloudflare con esta guía**: las filas de abajo son riesgos detectados al revisar el diseño, no observaciones.

## Cómo usarlo

Pide a alguien que **no conozca el proyecto** que despliegue siguiendo solo [la guía](guia-paso-a-paso.md), sin ayuda. Anota el minuto en que se atasca, qué dijo y qué cambió la guía o el panel para evitarlo.

## Riesgos conocidos (por verificar)

| # | Dónde | Riesgo | Cómo comprobarlo | Estado |
|---|---|---|---|---|
| 1 | Paso 1 | Los dos campos de KV del formulario traen el mismo nombre por defecto (el del Worker) y el despliegue falla («title already exists»). Con `wrangler.toml` los KV del formulario no se enlazaban; con `wrangler.jsonc` sí (2026-10-30). | Cambiar los dos nombres a valores distintos (`catalogo-datos`, `catalogo-fotos`); si falla, borrar los KV sobrantes antes de repetir. | Verificado con `wrangler.jsonc` (bindings ya enlazados, sin «Provisioning») |
| 2 | Paso 1 | Si el formulario no pide la contraseña, queda sin secreto hasta añadirla a mano y volver a desplegar. | Igual que el anterior. | Sin verificar |
| 3 | Paso 1 | El nombre exacto de los menús y formularios de Cloudflare puede diferir de la guía. | Seguir la guía con una cuenta nueva. | Sin verificar |
| 4 | Actualizar | El fork creado por el botón puede no recibir actualizaciones del template con facilidad. | Sincronizar un fork creado por el botón. | Sin verificar |
| 6 | Admin | ~~Opciones de precio de un servicio escritas como texto con `|`.~~ | Resuelto: filas con nombre, precio y minutos, y botones para añadir y quitar. | Resuelto (jsdom) |
| 7 | Admin | ~~Testimonios con `|` e IDs de items a mano en Landing.~~ | Resuelto: pestañas por sección, tarjetas de testimonios y casillas de items. | Resuelto (jsdom) |
| 8 | Cuota | Un ataque de contraseñas desde muchas IP podría gastar las escrituras diarias de KV. | Revisar el uso de KV tras unos días en línea. | Sin verificar |
| 9 | Revisión visual | Revisado con Chromium (Playwright) la portada en los 4 estilos y los editores del admin a 375 px; sin desbordes en 40 combinaciones de página, estilo y ancho. Tras el rediseño visual (blanco, Inter, tarjetas sobrias) también se revisaron a ojo ficha, carrito y FAQ; falta probar en un celular real. | Pasar el checklist E2E. | Parcial |
