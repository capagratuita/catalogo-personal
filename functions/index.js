import { paginaPublica, urlImagenValida } from './_lib/paginas.js';
import { htmlCatalogoEstatico, zonasAtendidas } from './_lib/seo.js';

export const onRequestGet = paginaPublica({
  claves: ['config', 'catalogo', 'landing'],
  meta: ({ config, catalogo, landing }, { origen }) => {
    const perfil = config.perfil;
    const logo = urlImagenValida(perfil.logo_url);
    const redes = [perfil.redes?.instagram, perfil.redes?.facebook, perfil.redes?.tiktok, perfil.redes?.youtube].filter(Boolean);

    const hero = landing.hero || {};
    const zonas = zonasAtendidas(catalogo, config);

    return {
      reescribir: rw => rw
        .on('.hero h1', { element(el) { el.setInnerContent(hero.titulo || perfil.nombre); } })
        .on('.hero p', { element(el) { if (hero.subtitulo) el.setInnerContent(hero.subtitulo); } })
        .on('#catalogo', { element(el) { el.append(htmlCatalogoEstatico(catalogo, config), { html: true }); } }),
      titulo: landing.seo?.titulo || perfil.nombre,
      descripcion: landing.seo?.descripcion || perfil.descripcion_corta,
      ruta: '/',
      imagen: logo || urlImagenValida(landing.hero?.imagen_fondo_url),
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: perfil.nombre, url: origen + '/' },
          {
            // Con servicios presenciales y zona, el negocio es local (areaServed)
            '@type': zonas.length ? 'LocalBusiness' : 'Organization',
            name: perfil.nombre,
            url: origen + '/',
            description: perfil.descripcion_corta,
            ...(logo && { logo }),
            ...(redes.length && { sameAs: redes }),
            ...(zonas.length && { areaServed: zonas.length === 1 ? zonas[0] : zonas }),
          },
        ],
      },
    };
  },
});
