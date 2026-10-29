// functions/api/chat.js
import { getContent } from '../_lib/defaults.js';
export const onRequestPost = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const { question } = await request.json();
    
    if (!question || question.trim() === '') {
      return new Response(JSON.stringify({ error: 'Pregunta vacía' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const catalogo = await getContent(env, 'catalogo');
    const faq = await getContent(env, 'faq');
    const config = await getContent(env, 'config');
    
    if (!config || !config.negocio) {
      return new Response(JSON.stringify({ error: 'Config no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const systemPrompt = `
      Eres el asistente virtual de ${config.negocio.nombre}.
      Tono: ${config.negocio.tono_chat}
      Catálogo disponible: ${JSON.stringify(catalogo)}
      Preguntas frecuentes: ${JSON.stringify(faq)}
      Instrucciones: responde en español, breve, sin inventar información.
      Si la pregunta no está cubierta por el catálogo ni las FAQ, sugiere
      escribir por WhatsApp al ${config.negocio.whatsapp}.
    `;
    
    if (!env.AI) {
      return new Response(JSON.stringify({ error: 'El chat con IA no está disponible en este entorno. Configura el binding AI y ejecuta npx wrangler login.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];
    
    const aiResponse = await env.AI.run('@cf/meta/llama-3.2-1b-instruct', { messages });
    
    return new Response(JSON.stringify({ answer: aiResponse.response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return new Response(JSON.stringify({ error: 'Límite alcanzado, intenta más tarde' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.error('Error en chat:', error);
    return new Response(JSON.stringify({ error: 'Error en chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
