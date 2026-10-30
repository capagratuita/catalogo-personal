import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlCatalogoEstatico } from '../functions/_lib/seo.js';
import { ejemplo, copia } from './ayuda.mjs';

const catalogo = ejemplo('catalogo');
const config = ejemplo('config');

test('htmlCatalogoEstatico lista los items y enlaza solo los servicios', () => {
  const cfg = copia(config);
  cfg.perfil.tipo_catalogo = 'mixto';
  const cat = { items: [
    { id: 'pan', tipo: 'producto', nombre: 'Pan <b>', descripcion: 'Rico & fresco' },
    { id: 'clase', tipo: 'servicio', nombre: 'Clase', descripcion: 'Una hora' },
  ] };
  const html = htmlCatalogoEstatico(cat, cfg);
  assert.match(html, /Pan &lt;b&gt;/);
  assert.match(html, /Rico &amp; fresco/);
  assert.match(html, /<a href="\/producto\?id=clase">Clase<\/a>/);
  assert.doesNotMatch(html, /id=pan/);
});

test('htmlCatalogoEstatico respeta tipo_catalogo y devuelve vacío sin items', () => {
  const cfg = copia(config);
  cfg.perfil.tipo_catalogo = 'solo-servicios';
  const html = htmlCatalogoEstatico(copia(catalogo), cfg);
  assert.doesNotMatch(html, /<h2>Productos<\/h2>/);
  assert.equal(htmlCatalogoEstatico({ items: [] }, cfg), '');
});

import { xmlSitemap } from '../functions/_lib/seo.js';

test('xmlSitemap pone lastmod con la fecha más reciente y lo omite si no hay fecha', () => {
  const cat = { items: [{ id: 'a', tipo: 'servicio', nombre: 'A', descripcion: '' }] };
  const xml = xmlSitemap('https://x.test', cat, {
    config: '2026-01-01T00:00:00.000Z',
    catalogo: '2026-03-01T00:00:00.000Z',
    faq: '2026-02-01T00:00:00.000Z',
  });
  assert.match(xml, /<loc>https:\/\/x\.test\/<\/loc><lastmod>2026-03-01T/);
  assert.match(xml, /<loc>https:\/\/x\.test\/faq<\/loc><lastmod>2026-02-01T/);
  assert.match(xml, /id=a<\/loc><lastmod>2026-03-01T/);
  assert.doesNotMatch(xmlSitemap('https://x.test', cat, {}), /lastmod/);
});

import { zonasAtendidas } from '../functions/_lib/seo.js';

test('zonasAtendidas ignora servicios solo online, productos y solo-productos', () => {
  const cat = { items: [
    { id: 'a', tipo: 'servicio', modalidad: 'ambas', zona: ' Lima ' },
    { id: 'b', tipo: 'servicio', modalidad: 'presencial', zona: 'Lima' },
    { id: 'c', tipo: 'servicio', modalidad: 'online', zona: 'Todo el mundo' },
    { id: 'd', tipo: 'servicio' },
    { id: 'e', tipo: 'producto', zona: 'Cusco' },
  ] };
  assert.deepEqual(zonasAtendidas(cat, { perfil: { tipo_catalogo: 'mixto' } }), ['Lima']);
  assert.deepEqual(zonasAtendidas(cat, { perfil: { tipo_catalogo: 'solo-productos' } }), []);
});

import { direccionPostal } from '../functions/_lib/seo.js';

test('direccionPostal devuelve PostalAddress solo con ciudad y omite campos vacíos', () => {
  assert.deepEqual(
    direccionPostal({ calle: ' Av. Larco 123 ', ciudad: 'Lima', region: null, codigo_postal: '', pais: 'PE' }),
    { '@type': 'PostalAddress', streetAddress: 'Av. Larco 123', addressLocality: 'Lima', addressCountry: 'PE' },
  );
  assert.equal(direccionPostal(null), null);
  assert.equal(direccionPostal({ calle: 'Av. Larco 123' }), null);
});
