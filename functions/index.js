import { paginaPublica, urlImagenValida } from './_lib/paginas.js';

export const onRequestGet = paginaPublica({
  claves: ['config', 'catalogo', 'landing'],
  meta: ({ config, landing }, { origen }) => {
    const negocio = config.negocio;
    const logo = urlImagenValida(negocio.logo_url);
    const redes = [negocio.redes?.instagram, negocio.redes?.facebook].filter(Boolean);

    return {
      titulo: landing.seo?.titulo || negocio.nombre,
      descripcion: landing.seo?.descripcion || negocio.descripcion_corta,
      ruta: '/',
      imagen: logo || urlImagenValida(landing.hero?.imagen_fondo_url),
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: negocio.nombre, url: origen + '/' },
          {
            '@type': 'Organization',
            name: negocio.nombre,
            url: origen + '/',
            description: negocio.descripcion_corta,
            ...(logo && { logo }),
            ...(redes.length && { sameAs: redes }),
          },
        ],
      },
    };
  },
});
