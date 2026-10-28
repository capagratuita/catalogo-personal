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

async function loadCatalogo() {
  return await fetchJSON('/api/content?key=catalogo');
}

async function loadConfig() {
  return await fetchJSON('/api/content?key=config');
}

async function loadLanding() {
  return await fetchJSON('/api/content?key=landing');
}

async function loadFAQ() {
  return await fetchJSON('/api/content?key=faq');
}

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
  const numero = config.negocio.whatsapp;
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
  loadLanding,
  loadFAQ,
  renderItem,
  buildWhatsAppLink,
  requiereAgendamiento,
  formatPrecio,
  getCarrito,
  saveCarrito,
  addToCarrito,
  getCarritoTotal,
  getCarritoItemsCount
};
