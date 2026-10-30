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
