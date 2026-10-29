// assets/app.js
// Utilidades públicas para el frontend

async function fetchJSON(url) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

const contenido = {};

// Las páginas públicas llegan con los datos del sitio dentro del HTML (<script id="sitio-datos">),
// inyectados por functions/_lib/paginas.js: así no hace falta pedirlos a /api/content.
function datosEmbebidos() {
  try {
    const el = document.getElementById('sitio-datos');
    return el ? JSON.parse(el.textContent) : {};
  } catch {
    return {};
  }
}

// Cada key se pide una sola vez por página. Si aún no existe en KV (sitio recién
// desplegado), se usan los datos de ejemplo de /api/defaults. Si falla, se reintenta.
function loadContent(key) {
  if (!contenido[key]) {
    const embebido = datosEmbebidos()[key];
    contenido[key] = (embebido !== undefined ? Promise.resolve(embebido) : fetchContent(key)).catch(error => {
      delete contenido[key];
      throw error;
    });
  }
  return contenido[key];
}

async function fetchContent(key) {
  const response = await fetch(`/api/content?key=${key}`);
  if (response.status === 404) return await fetchJSON(`/api/defaults?key=${key}`);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  return await response.json();
}

const loadCatalogo = () => loadContent('catalogo');
const loadConfig = () => loadContent('config');
const loadLanding = () => loadContent('landing');
const loadFAQ = () => loadContent('faq');

const FUENTES = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
};

// Aplica landing.tema.fuente. Los colores no se tocan: la paleta de Capa Gratuita es fija (styles.css).
function aplicarTema(tema) {
  if (tema && FUENTES[tema.fuente]) {
    document.documentElement.style.setProperty('--font-body', FUENTES[tema.fuente]);
  }
}

// Rellena nombre, pie de página, redes y título con los datos de config.negocio.
function aplicarMarca(config) {
  const negocio = config && config.negocio;
  if (!negocio) return;

  document.querySelectorAll('nav .logo').forEach(el => { el.textContent = negocio.nombre; });

  const footerNombre = document.querySelector('footer h3');
  if (footerNombre) footerNombre.textContent = negocio.nombre;
  const footerDescripcion = document.querySelector('footer .container > div > p');
  if (footerDescripcion) footerDescripcion.textContent = negocio.descripcion_corta;

  const enlaces = {
    instagram: negocio.redes && negocio.redes.instagram,
    facebook: negocio.redes && negocio.redes.facebook,
    whatsapp: negocio.whatsapp ? `https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}` : null,
  };
  document.querySelectorAll('[data-red]').forEach(el => {
    const url = enlaces[el.dataset.red];
    el.hidden = !url;
    if (url) el.setAttribute('href', url);
  });

  if (!document.documentElement.dataset.marca) {
    document.documentElement.dataset.marca = '1';
    if (!document.title.includes(negocio.nombre)) {
      document.title = document.title ? `${document.title} - ${negocio.nombre}` : negocio.nombre;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfig().then(aplicarMarca).catch(() => {});
  loadLanding().then(landing => aplicarTema(landing.tema)).catch(() => {});
});

function renderItem(item, config, catalogo) {
  const isService = item.tipo === 'servicio';
  const isProduct = item.tipo === 'producto';
  const esCita = requiereAgendamiento(item, catalogo);
  const calendlyUrl = esCita ? (item.calendly_url || config.negocio.calendly_url) : null;
  
  let priceHtml = '';
  if (isProduct) {
    priceHtml = `<span class="precio">${formatPrecio(item.precio, config.negocio.moneda)}</span>`;
  }
  
  let durationHtml = '';
  if (isService) {
    durationHtml = `<div class="servicio-info"><span class="icono-reloj">⏰</span> ${item.duracion_minutos} minutos</div>`;
  }
  
  let calendlyHtml = '';
  if (calendlyUrl) {
    calendlyHtml = `<a href="${calendlyUrl}" class="btn-calendly" target="_blank" rel="noopener">Reservar Cita</a>`;
  }
  
  let actionButton = '';
  const mostrarCarrito = !calendlyUrl && (item.tipo === 'servicio' || config.negocio.modo_negocio !== 'solo-servicios');
  if (mostrarCarrito) {
    actionButton = `<button class="btn-add-to-cart" data-id="${item.id}">Añadir al Carrito</button>`;
  }
  
  return `
    <div class="item-card" data-id="${item.id}" data-tipo="${item.tipo}">
      <h3>${item.nombre}</h3>
      <p class="descripcion">${item.descripcion}</p>
      ${priceHtml}
      ${durationHtml}
      <div class="item-actions">
        <a href="/producto?id=${item.id}" class="btn-ver">Ver Detalles</a>
        ${calendlyHtml}
        ${actionButton}
      </div>
    </div>
  `;
}

function buildWhatsAppLink(config, mensaje) {
  const numero = String(config.negocio.whatsapp || '').replace(/\D/g, '');
  const encodedMensaje = encodeURIComponent(mensaje);
  return `https://wa.me/${numero}?text=${encodedMensaje}`;
}

function requiereAgendamiento(item, catalogo) {
  if (!item || item.tipo !== 'servicio') return false;
  const categorias = Array.isArray(catalogo?.categorias_agendamiento)
    ? catalogo.categorias_agendamiento
    : [];
  return categorias.includes(item.categoria);
}

// Servicios cuyo precio se confirma antes de contratar: no van al carrito, se consultan por WhatsApp.
function requiereCotizacion(item) {
  return Boolean(item) && item.tipo === 'servicio' && item.precio_a_consultar === true;
}

// "Desde X" si hay precio orientativo, "Precio a consultar" si es 0; precio normal en el resto.
function textoPrecio(item, moneda) {
  if (!requiereCotizacion(item)) return formatPrecio(item.precio, moneda);
  return item.precio > 0 ? `Desde ${formatPrecio(item.precio, moneda)}` : 'Precio a consultar';
}

function buildCotizacionLink(config, item) {
  let mensaje = `Hola, quisiera cotizar el servicio "${item.nombre}"`;
  if (item.duracion_minutos > 0) mensaje += ` (duración estimada: ${item.duracion_minutos} min)`;
  mensaje += '. ¿Me confirmas el precio y la disponibilidad?';
  return buildWhatsAppLink(config, mensaje);
}

function formatPrecio(precio, moneda) {
  const formato = new Intl.NumberFormat('es', {
    style: 'currency',
    currency: moneda || 'PEN',
    minimumFractionDigits: 2,
  });
  return formato.format(precio);
}

function getCarrito() {
  const carrito = localStorage.getItem('carrito');
  return carrito ? JSON.parse(carrito) : [];
}

function saveCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function addToCarrito(id, nombre, precio, moneda) {
  const carrito = getCarrito();
  const itemExistente = carrito.find(item => item.id === id);
  
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({
      id: id,
      nombre: nombre,
      precio: precio,
      moneda: moneda,
      cantidad: 1
    });
  }
  
  saveCarrito(carrito);
  return carrito;
}

function getCarritoTotal(carrito, config) {
  return carrito.reduce((total, item) => {
    return total + (item.precio * item.cantidad);
  }, 0);
}

function getCarritoItemsCount(carrito) {
  return carrito.reduce((total, item) => total + item.cantidad, 0);
}

window.app = {
  fetchJSON,
  loadCatalogo,
  loadConfig,
  aplicarMarca,
  aplicarTema,
  loadLanding,
  loadFAQ,
  renderItem,
  buildWhatsAppLink,
  requiereAgendamiento,
  requiereCotizacion,
  textoPrecio,
  buildCotizacionLink,
  formatPrecio,
  getCarrito,
  saveCarrito,
  addToCarrito,
  getCarritoTotal,
  getCarritoItemsCount
};
