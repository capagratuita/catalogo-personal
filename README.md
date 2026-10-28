# Catálogo Personal desplegable en Cloudflare

## Descripción

Este repositorio es un **template desplegable** para que personas sin conocimientos técnicos (profesionales independientes, emprendedores, hobbies) publiquen un catálogo personal de productos y/o servicios con:

- Landing page customizable.
- Catálogo de productos y servicios.
- Carrito simple que hace checkout por WhatsApp.
- Citas por Calendly para servicios.
- Chat de preguntas frecuentes con LLM.
- Panel de administración web protegido por contraseña.

El usuario final **nunca toca una terminal, nunca crea tokens de API, nunca edita código**. Solo hace clics en el dashboard de Cloudflare, copia y pega JSONs, y sube fotos.

**Este repo NO es una plataforma SaaS multi-inquilino.** Cada usuario hace fork y despliega su propia instancia.

## Requisitos

- Cuenta de Cloudflare (gratuita funciona)
- Un Workers KV namespace
- Un R2 bucket
- Un Workers AI binding (incluido en Workers gratis)
- Una variable secreta `ADMIN_PASSWORD` (para proteger el admin)

## Cómo correr en local

1. Instala Node.js y npm si no tienes:
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install nodejs npm
   
   # macOS (con Homebrew)
   brew install node
   
   # O desde nodejs.org
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Clona este repositorio y navega al directorio:
   ```bash
   git clone https://github.com/anomalyco/personal-ecommerce.git
   cd personal-ecommerce
   ```

3. Instala las dependencias:
   ```bash
   npm install
   ```

4. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

   Esto levantará un servidor local en `http://localhost:8788` con auto-restart en cambios.

5. Abre tu navegador y visita `http://localhost:8788`

## Cómo desplegar en Cloudflare

1. Inicia sesión en Cloudflare Dashboard e ingresa a Workers (o Pages).

2. Crea un nuevo Workers KV namespace y un R2 bucket (ambos gratuitos).

3. Copia las IDs de estos servicios y actualiza `wrangler.toml`:
    ```toml
    [[kv_namespaces]]
binding = "KV"
id = "tu-id-de-kv"

    [[r2_buckets]]
binding = "IMAGES"
bucket_name = "tu-bucket-de-r2"

    [ai]
binding = "AI"
    ```

4. Agrega la variable secreta `ADMIN_PASSWORD` en el dashboard de Cloudflare Pages:
   - Navega a: Pages → tu proyecto → Settings → Environment variables
   - Agrega una nueva variable: `ADMIN_PASSWORD`
   - Tipo: Secret
   - Valor: elige una contraseña segura (mínimo 12 caracteres)

5. El Workers AI binding viene gratis con Workers, no requiere configuración adicional.

6. Ejecuta el deploy:
    ```bash
    npx wrangler pages deploy public
    ```

    Esto desplegará las Pages en Cloudflare.

7. Una vez desplegado, visita tu sitio en el dominio proporcionado por Cloudflare Pages.

## Próximos pasos

Después del bootstrap inicial, necesitarás:

1. **Completar las funciones API** (`functions/api/*.js`) para content, upload, chat y login
2. **Crear las páginas públicas** (`public/*.html`) y utilidades (`public/assets/*.js`) 
3. **Configurar el middleware** (`functions/_middleware.js`) para autenticación
4. **Llenar el contenido inicial** en KV (o usar los ejemplos en `config/`)
5. **Configurar el dominio personalizado** en Cloudflare Pages (opcional)

El workflow para usuarios finales es:
1. Forkear este repo
2. Desplegar en Cloudflare
3. Ingresar a `/admin/` con la contraseña
4. Copiar/pegar los JSON de ejemplo desde `config/` a `/api/content`
5. Subir fotos de productos desde `/admin/fotos.html`
6. ¡Listo! El sitio público ya está disponible.

## Stack tecnológico

- **Frontend**: Cloudflare Pages (estáticos) - HTML + CSS + JS vanilla
- **API**: Pages Functions (`/api/*`)
- **Contenido**: Workers KV (4 keys: `config`, `catalogo`, `landing`, `faq`)
- **Imágenes**: R2 (`items/{id}.{ext}`)
- **Chat**: Workers AI (`@cf/meta/llama-3.2-1b-instruct`)
- **Auth**: Variable secreta `ADMIN_PASSWORD` con cookies firmadas HMAC
- **Citas**: Calendly embed
- **WhatsApp**: Enlaces `wa.me` generados en cliente
- **Carrito**: `localStorage` sin servidor
- **Generación de contenido**: Claude Projects (capa gratuita)

## Licencia

MIT
