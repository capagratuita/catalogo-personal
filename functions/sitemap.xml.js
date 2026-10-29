import { getContent } from './_lib/defaults.js';

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const onRequestGet = async ({ request, env }) => {
  const origen = new URL(request.url).origin;
  const catalogo = await getContent(env, 'catalogo', request);

  const rutas = ['/', '/faq', ...catalogo.items.map(item => `/producto?id=${encodeURIComponent(item.id)}`)];
  const urls = rutas.map(ruta => `  <url><loc>${escapar(origen + ruta)}</loc></url>`).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
  );
};
