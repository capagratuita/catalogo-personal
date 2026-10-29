// assets/admin.js
// Utilidades del admin

async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

async function login(password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en el servidor');
  }

  return await response.json();
}

async function isAuthenticated() {
  const response = await fetch('/api/session');
  return response.ok;
}

const CONTENT_KEYS = ['config', 'catalogo', 'landing', 'faq'];

// Devuelve el contenido guardado. Si la key aún no existe (primer arranque),
// devuelve los datos de ejemplo y avisa de que todavía no están guardados.
async function getContent(key) {
  const response = await fetch(`/api/content?key=${key}`, { cache: 'no-store' });

  if (response.status === 404) {
    const ejemplo = await fetch(`/api/defaults?key=${key}`);
    if (ejemplo.ok) {
      mostrarAvisoEjemplo();
      return await ejemplo.json();
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error obteniendo contenido');
  }
  return await response.json();
}

function mostrarAvisoEjemplo() {
  if (document.getElementById('aviso-ejemplo')) return;

  const panel = document.querySelector('.admin-panel');
  if (!panel) return;

  const aviso = document.createElement('div');
  aviso.id = 'aviso-ejemplo';
  aviso.setAttribute('role', 'status');
  aviso.style.cssText = 'background:#fff8e1;color:#5d4037;border:1px solid #ffb300;padding:0.8rem 1rem;border-radius:5px;margin-bottom:1.5rem;';
  aviso.textContent = 'Aún no hay datos guardados: se muestran datos de ejemplo. Edítalos y pulsa Guardar para publicarlos.';

  const header = panel.querySelector('.admin-header');
  panel.insertBefore(aviso, header ? header.nextSibling : panel.firstChild);
}

async function putContent(key, data) {
  const response = await fetch(`/api/content?key=${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error guardando contenido');
  }

  // Ya hay datos guardados: el aviso de ejemplo deja de ser cierto
  const aviso = document.getElementById('aviso-ejemplo');
  if (aviso) aviso.remove();

  return await response.json();
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/admin/index.html';
}

const FOTO_LADO_MAX = 1200;
const FOTO_PESO_MAX = 250 * 1024;

function canvasABlob(canvas, calidad) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad));
}

// Reduce la foto a JPEG de hasta 1200 px y ~250 KB. Una imagen ligera y en JPEG se ve rápido en el sitio
// y es la que WhatsApp acepta en la vista previa de un enlace (con WebP o pesos grandes no la muestra).
// Si el navegador no puede procesarla, devuelve el archivo original.
async function optimizarImagen(archivo) {
  try {
    const bitmap = await createImageBitmap(archivo);
    let escala = Math.min(1, FOTO_LADO_MAX / Math.max(bitmap.width, bitmap.height));
    let blob;

    for (let intento = 0; intento < 4; intento++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * escala));
      canvas.height = Math.max(1, Math.round(bitmap.height * escala));

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // JPEG no tiene transparencia
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const calidad of [0.85, 0.78, 0.7, 0.62, 0.55]) {
        blob = await canvasABlob(canvas, calidad);
        if (blob && blob.size <= FOTO_PESO_MAX) break;
      }
      if (blob && blob.size <= FOTO_PESO_MAX) break;
      escala *= 0.85;
    }

    bitmap.close();
    if (!blob) return archivo;
    return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
  } catch {
    return archivo;
  }
}

// Respaldo: un solo JSON con las 4 keys. Las escrituras pasan por PUT /api/content.
async function exportarTodo() {
  const respaldo = { version: 1, exportado: new Date().toISOString() };

  for (const key of CONTENT_KEYS) {
    const response = await fetch(`/api/content?key=${key}`, { cache: 'no-store' });
    if (response.ok) respaldo[key] = await response.json();
  }

  if (!CONTENT_KEYS.some(key => key in respaldo)) {
    throw new Error('No hay contenido guardado para exportar');
  }
  return respaldo;
}

async function importarTodo(respaldo) {
  if (!respaldo || typeof respaldo !== 'object' || Array.isArray(respaldo)) {
    throw new Error('El archivo no es un respaldo válido');
  }

  const presentes = CONTENT_KEYS.filter(key => key in respaldo);
  if (!presentes.length) {
    throw new Error('El archivo no contiene config, catalogo, landing ni faq');
  }

  const resultados = [];
  for (const key of presentes) {
    try {
      await putContent(key, respaldo[key]);
      resultados.push({ key, ok: true });
    } catch (error) {
      resultados.push({ key, ok: false, error: error.message });
    }
  }
  return resultados;
}

const SECCIONES_ADMIN = [
  ['identidad.html', 'Identidad'],
  ['catalogo.html', 'Catálogo'],
  ['fotos.html', 'Fotos'],
  ['landing.html', 'Landing'],
  ['faq.html', 'FAQ'],
  ['respaldo.html', 'Respaldo'],
];

// Barra de navegación común; el login (index.html) no la lleva.
function montarNavegacionAdmin() {
  // Pages sirve /admin/identidad sin la extensión .html
  const actual = location.pathname.split('/').pop().replace(/\.html$/, '');
  const contenedor = document.querySelector('nav .container');
  if (!contenedor || !SECCIONES_ADMIN.some(([archivo]) => archivo.replace(/\.html$/, '') === actual)) return;

  const lista = document.createElement('ul');
  lista.className = 'nav-links';
  lista.setAttribute('aria-label', 'Secciones del panel');
  lista.style.cssText = 'flex-wrap:wrap;justify-content:center;gap:0 1rem;';

  for (const [archivo, nombre] of SECCIONES_ADMIN) {
    const item = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.href = `/admin/${archivo}`;
    enlace.textContent = nombre;
    if (archivo.replace(/\.html$/, '') === actual) {
      enlace.setAttribute('aria-current', 'page');
      enlace.style.color = 'var(--primary)';
      enlace.style.fontWeight = '700';
    }
    item.appendChild(enlace);
    lista.appendChild(item);
  }
  contenedor.appendChild(lista);
}

document.addEventListener('DOMContentLoaded', montarNavegacionAdmin);

window.admin = {
  fetchJSON,
  login,
  isAuthenticated,
  getContent,
  putContent,
  optimizarImagen,
  exportarTodo,
  importarTodo,
  logout
};
