# Guía paso a paso: publica tu catálogo en Cloudflare

Esta guía es para quien quiere publicar sus **servicios** (y, si quiere, algunos productos) sin programar. No necesitas terminal ni tarjeta de crédito: todo se hace con clics en GitHub y en el dashboard de Cloudflare, y cabe en la capa gratuita.

> Los nombres de los menús de Cloudflare cambian de vez en cuando. Si algo no coincide, busca la opción con un nombre parecido.

**Tiempo estimado:** 30–45 minutos la primera vez.

## Qué necesitas

- Una cuenta de [GitHub](https://github.com) (gratuita).
- Una cuenta de [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuita).
- Tu número de WhatsApp con código de país (por ejemplo `+51999999999`).
- Una contraseña larga para el panel de administración (mínimo 12 caracteres; el sitio te avisará si es más corta).

## Paso 1. Haz tu copia del proyecto

1. Abre el repositorio del template en GitHub.
2. Pulsa **Fork** → **Create fork**. Ahora tienes tu propia copia, y es la que vas a publicar.

## Paso 2. Crea los dos almacenes de datos (KV)

Un almacén guarda tus textos y catálogo; el otro guarda las fotos.

1. En Cloudflare, entra en **Storage & Databases → KV** (o **Workers & Pages → KV**).
2. Pulsa **Create a namespace**, nómbralo `catalogo-contenido` y créalo.
3. Crea otro con el nombre `catalogo-fotos-kv`.
4. En la lista verás una columna **ID** (32 letras y números). **Copia los dos IDs** en un bloc de notas, anotando cuál es cuál.

## Paso 3. Pon tus IDs en el proyecto

El proyecto trae los IDs del autor; tienes que cambiarlos por los tuyos.

1. En tu fork de GitHub, abre el archivo `wrangler.toml` y pulsa el icono del lápiz (**Edit**).
2. Busca los dos bloques `[[kv_namespaces]]`:
   - el de `binding = "KV"` → pega el ID de `catalogo-contenido`;
   - el de `binding = "IMAGES"` → pega el ID de `catalogo-fotos-kv`.
3. Cambia `name = "personal-ecommerce"` por el nombre que usarás para tu proyecto en Cloudflare (solo letras, números y guiones).
4. **No toques nada más.** Pulsa **Commit changes**.

## Paso 4. Conecta el proyecto a Cloudflare Pages

1. En Cloudflare: **Workers & Pages → Create application → Pages → Connect to Git**.
2. Autoriza GitHub y elige tu fork.
3. En **Set up builds and deployments**:
   - **Project name:** el mismo que pusiste en `name` en el paso 3.
   - **Production branch:** `main`.
   - **Framework preset:** ninguno.
   - **Build command:** déjalo vacío.
   - **Build output directory:** `public`.
4. Pulsa **Save and Deploy**. Cuando termine verás una dirección del tipo `https://tu-proyecto.pages.dev`.

> El sitio ya funciona y muestra datos de ejemplo, pero todavía no puedes entrar al panel: falta la contraseña.

## Paso 5. Crea tu contraseña de administrador

1. En tu proyecto de Pages: **Settings → Variables and Secrets → Add**.
2. Tipo **Secret**, nombre exactamente `ADMIN_PASSWORD`, valor: tu contraseña.
3. Guarda y, si te lo pide, **vuelve a desplegar** (pestaña **Deployments** → los tres puntos del último despliegue → **Retry deployment**), porque el cambio se aplica en el siguiente despliegue.

Nunca pegues la contraseña en GitHub ni en ningún archivo del proyecto.

## Paso 6. Configura tu sitio

Entra en `https://tu-proyecto.pages.dev/admin` e inicia sesión. En el menú del panel (General, Landing, Catálogo, Fotos, FAQ, Respaldo):

1. **General:** nombre, descripción corta, WhatsApp (con código de país), moneda, modo de negocio (*solo servicios*, *solo productos* o *mixto*), enlace de reserva si usas una agenda, y tus redes. Pulsa **Guardar**.
2. **Landing:** el editor tiene una pestaña para la **Portada**, otra para **Apariencia y SEO** (color de acento, fuente) y una por cada sección. Con **+ Añadir sección** eliges el tipo: *Texto*, *Destacados*, *Galería*, *Sobre mí* (con tu foto, que subes en **Fotos**), *Testimonios* (solo opiniones reales, con permiso de quien las dio) o *Contacto*. En *Destacados* y *Galería* marcas los items con casillas (si aún no creaste tu catálogo, vuelve a esta pestaña después del paso 3). Cada sección puede mostrarse justo bajo la portada o debajo del catálogo. Cada sección se puede subir, bajar o eliminar, y nada se publica hasta pulsar **Guardar Landing**.
3. **Catálogo:** crea tus categorías y tus servicios. Para cada uno puedes indicar precio, duración, modalidad, zona, qué incluye y opciones de precio (por ejemplo «Sesión suelta» y «Pack de 4»), que añades con el botón **+ Añadir opción**. Si el precio se acuerda con el cliente, marca **Precio a consultar**.
4. **Fotos:** sube una foto por servicio. El panel las reduce solo para que carguen rápido y se vean bien al compartir por WhatsApp.
5. **FAQ:** hasta 15 preguntas frecuentes.
6. **Respaldo:** descarga una copia de todo tu contenido y guárdala. Hazlo antes de cambios grandes.

Hasta que pulses **Guardar** en cada sección, el sitio muestra los datos de ejemplo.

## Paso 7. Cómo se reserva y cómo se compra

- **Servicios:** cada servicio tiene un solo botón. «Reservar Cita» lleva a tu agenda (Calendly, Cal.com, Google Calendar…) si la categoría está marcada *con reserva*; en el resto, «Consultar por WhatsApp» abre un mensaje ya escrito.
- **Productos:** tienen carrito; al terminar, se arma un mensaje de WhatsApp con el pedido. No hay pagos en línea: el cobro lo acuerdas tú con el cliente.

## Paso 8 (opcional). Dominio propio y visitas

- **Dominio propio:** en tu proyecto, **Custom domains → Set up a custom domain**.
- **Visitas:** en Cloudflare, **Analytics & Logs → Web Analytics → Add a site**, copia el *token* y pégalo en **Admin → General → Token de Cloudflare Web Analytics**. No usa cookies.

## Cómo traer mejoras del template

Tu fork no se actualiza solo. Cuando quieras las mejoras nuevas:

1. En tu fork de GitHub pulsa **Sync fork → Update branch**.
2. Si GitHub avisa de un conflicto, casi seguro es en `wrangler.toml` (tus IDs). Conserva **tus** IDs y tu `name`.
3. Cloudflare vuelve a desplegar solo. Tu contenido (catálogo, fotos, textos) está en KV, no en el repositorio, así que no se pierde.

## Problemas frecuentes

| Qué ves | Qué hacer |
|---|---|
| El panel dice «ADMIN_PASSWORD no configurada» | Falta el paso 5, o falta volver a desplegar después de crear el secreto. |
| «Contraseña incorrecta» y luego «Demasiados intentos» | Espera 15 minutos. Tras 5 fallos seguidos el acceso se bloquea temporalmente. |
| Subo una foto y no cambia | Los cambios pueden tardar hasta 1 minuto en verse. Recarga con Ctrl+F5. |
| Guardo y sale un error en rojo | Léelo: indica qué campo corregir (por ejemplo, un enlace que debe empezar por `https://`). |
| Al guardar la Landing sale un error sobre items | Una sección «Destacados» o «Galería» usa un item que ya no existe en el catálogo. En esa sección aparece marcado en rojo: desmárcalo. |
| El sitio muestra datos de otra persona | No guardaste esa sección todavía. Entra al panel y pulsa **Guardar**. |

## Límites de la capa gratuita (referencia)

Cada visita consume pocas operaciones (la página y una por foto), y el sitio usa caché para ahorrar lecturas. Para un negocio personal sobra. Si algún día lo superas, Cloudflare te lo indica en el dashboard.

## Extra opcional: chat con IA

El código incluye un chat (`/api/chat`) que responde con tu catálogo y FAQ usando Workers AI, pero **está desactivado** y las páginas públicas no tienen botón de chat. Activarlo exige descomentar el bloque `[ai]` de `wrangler.toml` y autenticar Wrangler (`npx wrangler login`) en una terminal, además de que un chat público puede consumir tu cuota gratuita de IA. Para la mayoría de los casos, un buen FAQ más el botón de WhatsApp resuelve lo mismo.
