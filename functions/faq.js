import { paginaPublica, urlImagenValida } from './_lib/paginas.js';

export const onRequestGet = paginaPublica({
  claves: ['config', 'faq', 'landing'],
  meta: ({ config, faq }) => {
    const negocio = config.negocio;
    const preguntas = faq.preguntas || [];

    return {
      titulo: `Preguntas frecuentes - ${negocio.nombre}`,
      descripcion: `Respuestas a las preguntas más comunes sobre ${negocio.nombre}.`,
      ruta: '/faq',
      imagen: urlImagenValida(negocio.logo_url),
      jsonLd: preguntas.length && {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: preguntas.map(({ p, r }) => ({
          '@type': 'Question',
          name: p,
          acceptedAnswer: { '@type': 'Answer', text: r },
        })),
      },
    };
  },
});
