// HTML real para buscadores y vistas previas sin JavaScript. Módulo puro (testeable en Node).
// app.js repinta la página con las tarjetas interactivas y retira este bloque.

const TITULOS = { producto: 'Productos', servicio: 'Servicios' };

export function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tiposVisibles(config) {
  const modo = config?.perfil?.tipo_catalogo;
  if (modo === 'solo-productos') return ['producto'];
  if (modo === 'solo-servicios') return ['servicio'];
  return ['producto', 'servicio'];
}

// Lista de items por tipo. Los servicios enlazan a su ficha, igual que las tarjetas.
export function htmlCatalogoEstatico(catalogo, config) {
  const items = Array.isArray(catalogo?.items) ? catalogo.items : [];
  const secciones = tiposVisibles(config).map(tipo => {
    const delTipo = items.filter(item => item.tipo === tipo);
    if (!delTipo.length) return '';
    const lista = delTipo.map(item => {
      const nombre = escaparHtml(item.nombre);
      const titulo = tipo === 'servicio'
        ? `<a href="/producto?id=${encodeURIComponent(item.id)}">${nombre}</a>`
        : nombre;
      return `<li><h3>${titulo}</h3><p>${escaparHtml(item.descripcion)}</p></li>`;
    }).join('');
    return `<h2>${TITULOS[tipo]}</h2><ul>${lista}</ul>`;
  }).join('');

  return secciones
    ? `<section class="catalogo catalogo-estatico" id="catalogo-estatico"><div class="container">${secciones}</div></section>`
    : '';
}

function masReciente(...fechas) {
  return fechas.filter(Boolean).sort().at(-1);
}

// sitemap.xml. `fechas` trae el updated_at (ISO) de cada key de contenido; las que nunca se
// han guardado no lo tienen y su URL va sin <lastmod> (mejor omitirlo que inventarlo).
// Los items comparten la fecha del catálogo: no se guarda una por item.
export function xmlSitemap(origen, catalogo, fechas = {}) {
  const rutas = [
    ['/', masReciente(fechas.config, fechas.catalogo, fechas.landing)],
    ['/faq', masReciente(fechas.config, fechas.faq)],
    ...catalogo.items.map(item => [`/producto?id=${encodeURIComponent(item.id)}`, masReciente(fechas.config, fechas.catalogo)]),
  ];
  const urls = rutas.map(([ruta, fecha]) =>
    `  <url><loc>${escaparHtml(origen + ruta)}</loc>${fecha ? `<lastmod>${fecha}</lastmod>` : ''}</url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
