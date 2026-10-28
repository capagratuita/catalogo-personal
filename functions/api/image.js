const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function safeKey(value) {
  if (typeof value !== 'string') return null;

  const key = value.startsWith('items/') ? value.slice('items/'.length) : value;
  if (!/^[a-z0-9-]+(\.[a-z0-9]+)?$/.test(key)) return null;

  return key.includes('.') ? `items/${key}` : key;
}

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = safeKey(url.searchParams.get('id')) || safeKey(url.searchParams.get('url'));

  if (!key) {
    return new Response('Imagen no encontrada', { status: 404 });
  }

  const candidates = key.includes('.') ? [key] : EXTENSIONS.map(ext => `items/${key}.${ext}`);

  for (const candidate of candidates) {
    const object = await env.IMAGES.get(candidate);
    if (!object) continue;

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new Response('Imagen no encontrada', { status: 404 });
};
