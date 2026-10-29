# Registro de fricciones

Aquí se anota todo lo que le cuesta a una persona real al desplegar y usar el template. **Todavía no se ha hecho una prueba con una persona ajena ni un despliegue real en Cloudflare con esta guía**: las filas de abajo son riesgos detectados al revisar el diseño, no observaciones.

## Cómo usarlo

Pide a alguien que **no conozca el proyecto** que despliegue siguiendo solo [la guía](guia-paso-a-paso.md), sin ayuda. Anota el minuto en que se atasca, qué dijo y qué cambió la guía o el panel para evitarlo.

## Riesgos conocidos (por verificar)

| # | Dónde | Riesgo | Cómo comprobarlo | Estado |
|---|---|---|---|---|
| 1 | Paso 3 | Editar `wrangler.toml` en GitHub asusta; un ID mal pegado rompe el despliegue sin un mensaje claro. | Observar si pegan bien los IDs. | Sin verificar |
| 2 | Paso 3 | Si `name` no coincide con el proyecto de Pages, la configuración puede no aplicarse. | Desplegar con un nombre distinto y mirar el resultado. | Sin verificar |
| 3 | Paso 5 | El secreto no se aplica hasta un nuevo despliegue. | Medir cuánta gente no vuelve a desplegar. | Sin verificar |
| 4 | Paso 4 | El nombre exacto de los menús de Cloudflare puede diferir de la guía. | Seguir la guía con una cuenta nueva. | Sin verificar |
| 5 | Actualizar | El conflicto en `wrangler.toml` al sincronizar el fork es confuso. | Sincronizar un fork con IDs propios. | Sin verificar |
| 6 | Admin | ~~Opciones de precio de un servicio escritas como texto con `|`.~~ | Resuelto: filas con nombre, precio y minutos, y botones para añadir y quitar. | Resuelto (jsdom) |
| 7 | Admin | ~~Testimonios con `|` e IDs de items a mano en Landing.~~ | Resuelto: pestañas por sección, tarjetas de testimonios y casillas de items. | Resuelto (jsdom) |
| 8 | Cuota | Un ataque de contraseñas desde muchas IP podría gastar las escrituras diarias de KV. | Revisar el uso de KV tras unos días en línea. | Sin verificar |
| 9 | Revisión visual | Revisado con Chromium (Playwright) la portada en los 4 estilos y los editores del admin a 375 px; sin desbordes en 40 combinaciones de página, estilo y ancho. Faltan ficha, carrito y FAQ a ojo, y probar en un celular real. | Pasar el checklist E2E. | Parcial |
