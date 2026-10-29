import { paginaPublica, urlImagenValida } from './_lib/paginas.js';

export const onRequestGet = paginaPublica({
  claves: ['config', 'catalogo', 'landing'],
  meta: ({ config, landing }, { origen }) => {
    const perfil = config.perfil;
    const logo = urlImagenValida(perfil.logo_url);
    const redes = [perfil.redes?.instagram, perfil.redes?.facebook].filter(Boolean);

    return {
      titulo: landing.seo?.titulo || perfil.nombre,
      descripcion: landing.seo?.descripcion || perfil.descripcion_corta,
      ruta: '/',
      imagen: logo || urlImagenValida(landing.hero?.imagen_fondo_url),
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: perfil.nombre, url: origen + '/' },
          {
            '@type': 'Organization',
            name: perfil.nombre,
            url: origen + '/',
            description: perfil.descripcion_corta,
            ...(logo && { logo }),
            ...(redes.length && { sameAs: redes }),
          },
        ],
      },
    };
  },
});
