import config from '../../config/config.example.json';
import catalogo from '../../config/catalogo.example.json';
import landing from '../../config/landing.example.json';
import faq from '../../config/faq.example.json';

export const DEFAULTS = { config, catalogo, landing, faq };

// Contenido guardado en KV o, si la key aún no existe (sitio recién desplegado),
// los datos de ejemplo: el mismo criterio que usan las páginas públicas y el admin.
export async function getContent(env, key) {
  const guardado = await env.KV.get(key, { type: 'json' });
  return guardado ?? DEFAULTS[key] ?? null;
}
