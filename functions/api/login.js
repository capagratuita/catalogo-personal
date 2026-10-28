import { createSessionCookie, json, timingSafeStringEqual } from '../_lib/auth.js';

export const onRequestPost = async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: 'ADMIN_PASSWORD no configurada' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) {
    return json({ error: 'Contraseña requerida' }, 400);
  }

  if (!timingSafeStringEqual(password, env.ADMIN_PASSWORD)) {
    return json({ error: 'Contraseña incorrecta' }, 401);
  }

  const cookie = await createSessionCookie(request, env);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
};
