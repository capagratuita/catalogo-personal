import { json, verifySession } from '../_lib/auth.js';

const CONTENT_KEYS = ['config', 'catalogo', 'landing', 'faq'];

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validateType(value, expected, field) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  const actual = valueType(value);
  if (!allowed.includes(actual)) {
    fail(`El campo '${field}' debe ser de tipo ${allowed.join(' o ')}, recibido ${actual}`);
  }
}

function validateObject(data, schema, prefix = '') {
  if (!isPlainObject(data)) {
    fail(`El campo '${prefix || 'datos'}' debe ser un objeto`);
  }

  for (const [key, expected] of Object.entries(schema)) {
    const field = prefix ? `${prefix}.${key}` : key;
    if (!(key in data)) {
      fail(`Campo requerido faltante: ${field}`);
    }

    if (isPlainObject(expected)) {
      validateObject(data[key], expected, field);
    } else {
      validateType(data[key], expected, field);
    }
  }

  return data;
}

export function validateConfig(data) {
  validateObject(data, {
    negocio: {
      nombre: 'string',
      descripcion_corta: 'string',
      whatsapp: 'string',
      email: 'string',
      moneda: 'string',
      modo_negocio: 'string',
      calendly_url: ['string', 'null'],
      logo_url: ['string', 'null'],
      redes: {
        instagram: ['string', 'null'],
        facebook: ['string', 'null'],
      },
      tono_chat: 'string',
    },
  });

  if (!['solo-productos', 'solo-servicios', 'mixto'].includes(data.negocio.modo_negocio)) {
    fail("El campo 'negocio.modo_negocio' debe ser 'solo-productos', 'solo-servicios' o 'mixto'");
  }
  if (!/^[A-Z]{3}$/.test(data.negocio.moneda)) {
    fail("El campo 'negocio.moneda' debe ser un código ISO 4217 de 3 letras");
  }

  return data;
}

export function validateCatalogo(data) {
  if (!isPlainObject(data)) fail('El catálogo debe ser un objeto');
  if (!Array.isArray(data.categorias)) fail("El campo 'categorias' debe ser un array");
  if (!Array.isArray(data.items)) fail("El campo 'items' debe ser un array");
  if (data.items.length > 200) fail('El catálogo debe tener máximo 200 items');

  if (!data.categorias.every(categoria => typeof categoria === 'string' && categoria.trim())) {
    fail('Cada categoría debe ser un string no vacío');
  }

  const categorias = new Set(data.categorias);
  const ids = new Set();

  for (const item of data.items) {
    if (!isPlainObject(item)) fail('Cada item debe ser un objeto');

    if (typeof item.id !== 'string' || !/^[a-z0-9-]+$/.test(item.id)) {
      fail(`El id del item '${item.id}' debe ser un slug en minúsculas, sin tildes ni espacios`);
    }
    if (ids.has(item.id)) {
      fail(`El id del item '${item.id}' está duplicado`);
    }
    ids.add(item.id);

    if (!['producto', 'servicio'].includes(item.tipo)) {
      fail(`El tipo del item '${item.id}' debe ser 'producto' o 'servicio'`);
    }
    if (typeof item.nombre !== 'string' || !item.nombre.trim()) {
      fail(`El item '${item.id}' debe tener un nombre`);
    }
    if (typeof item.descripcion !== 'string' || item.descripcion.length > 200) {
      fail(`La descripción del item '${item.id}' debe ser un string de máximo 200 caracteres`);
    }
    if (typeof item.precio !== 'number' || !Number.isFinite(item.precio) || item.precio < 0) {
      fail(`El precio del item '${item.id}' debe ser un número mayor o igual a 0`);
    }
    if (typeof item.categoria !== 'string' || !categorias.has(item.categoria)) {
      fail(`La categoría del item '${item.id}' debe existir en 'categorias'`);
    }
    if (typeof item.disponible !== 'boolean') {
      fail(`El campo 'disponible' del item '${item.id}' debe ser booleano`);
    }
    if (typeof item.destacado !== 'boolean') {
      fail(`El campo 'destacado' del item '${item.id}' debe ser booleano`);
    }

    if (item.tipo === 'servicio') {
      if (typeof item.duracion_minutos !== 'number' || !Number.isFinite(item.duracion_minutos) || item.duracion_minutos < 0) {
        fail(`La duración del item '${item.id}' debe ser un número mayor o igual a 0`);
      }
    } else if (item.duracion_minutos !== null) {
      fail(`El item '${item.id}' es un producto, duracion_minutos debe ser null`);
    }

    if (item.calendly_url !== null && typeof item.calendly_url !== 'string') {
      fail(`El calendly_url del item '${item.id}' debe ser una cadena o null`);
    }
  }

  return data;
}

export function validateLanding(data) {
  validateObject(data, {
    hero: {
      titulo: 'string',
      subtitulo: 'string',
      cta_texto: 'string',
      cta_enlace: 'string',
      imagen_fondo_url: ['string', 'null'],
    },
    secciones: 'array',
    tema: {
      color_primario: 'string',
      color_secundario: 'string',
      fuente: 'string',
      estilo: 'string',
    },
    seo: {
      titulo: 'string',
      descripcion: 'string',
    },
  });

  if (!['serif', 'sans', 'mono'].includes(data.tema.fuente)) {
    fail("El campo 'tema.fuente' debe ser 'serif', 'sans' o 'mono'");
  }
  if (!['rustico', 'moderno', 'minimalista', 'elegante'].includes(data.tema.estilo)) {
    fail("El campo 'tema.estilo' debe ser 'rustico', 'moderno', 'minimalista' o 'elegante'");
  }

  for (const seccion of data.secciones) {
    if (!isPlainObject(seccion)) fail('Cada sección debe ser un objeto');
    if (!['texto', 'destacados', 'galeria', 'contacto'].includes(seccion.tipo)) {
      fail(`El tipo de sección '${seccion.tipo}' no es válido`);
    }
    if (typeof seccion.titulo !== 'string') fail("Cada sección debe tener 'titulo' string");
    if (typeof seccion.contenido !== 'string') fail("Cada sección debe tener 'contenido' string");
    if (!Array.isArray(seccion.items_ids) || !seccion.items_ids.every(id => typeof id === 'string')) {
      fail("Cada sección debe tener 'items_ids' como array de strings");
    }
  }

  return data;
}

export function validateFAQ(data) {
  if (!isPlainObject(data)) fail('El FAQ debe ser un objeto');
  if (!Array.isArray(data.preguntas)) fail("El campo 'preguntas' debe ser un array");
  if (data.preguntas.length > 15) fail('El FAQ debe tener máximo 15 preguntas');

  for (const [index, pregunta] of data.preguntas.entries()) {
    if (!isPlainObject(pregunta)) fail(`La pregunta ${index + 1} debe ser un objeto`);
    if (typeof pregunta.p !== 'string' || !pregunta.p.trim()) {
      fail(`La pregunta ${index + 1} debe tener 'p' no vacío`);
    }
    if (typeof pregunta.r !== 'string' || !pregunta.r.trim()) {
      fail(`La pregunta ${index + 1} debe tener 'r' no vacío`);
    }
  }

  if (typeof data.tono !== 'string') fail("El campo 'tono' debe ser un string");
  return data;
}

const validators = {
  config: validateConfig,
  catalogo: validateCatalogo,
  landing: validateLanding,
  faq: validateFAQ,
};

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!CONTENT_KEYS.includes(key)) {
    return json({ error: 'Key inválida' }, 400);
  }

  try {
    const data = await env.KV.get(key, { type: 'json' });
    if (!data) {
      return json({ error: 'Contenido no encontrado' }, 404);
    }
    return json(data);
  } catch {
    return json({ error: 'Error obteniendo contenido' }, 500);
  }
};

export const onRequestPut = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!CONTENT_KEYS.includes(key)) {
    return json({ error: 'Key inválida' }, 400);
  }

  if (!(await verifySession(request, env))) {
    return json({ error: 'No autorizado' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido', detalle: 'El body debe ser JSON válido' }, 400);
  }

  try {
    validators[key](body);
    await env.KV.put(key, JSON.stringify(body));
    return json({ ok: true, updated_at: new Date().toISOString() });
  } catch (error) {
    return json({ error: 'JSON inválido', detalle: error.message }, 400);
  }
};
