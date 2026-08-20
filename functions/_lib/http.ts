import type { Env } from './types';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export function withPrivateHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  secured.headers.set('Cache-Control', 'private, no-store');
  secured.headers.set('Referrer-Policy', 'no-referrer');
  secured.headers.set('X-Content-Type-Options', 'nosniff');
  secured.headers.set('X-Frame-Options', 'DENY');
  secured.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return secured;
}

export function memberAppOrigin(env: Env, request: Request): string {
  const configured = env.MEMBER_APP_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/$/u, '');
  }

  const current = new URL(request.url);
  if (current.hostname === 'localhost' || current.hostname === '127.0.0.1') {
    return current.origin;
  }

  return 'https://members.pack60.org';
}

export function requireSameOriginMutation(request: Request): Response | null {
  const origin = request.headers.get('Origin');
  const requestUrl = new URL(request.url);
  const requestedWith = request.headers.get('X-Requested-With');
  const contentType = request.headers.get('Content-Type') ?? '';

  if (
    origin !== requestUrl.origin ||
    requestedWith !== 'XMLHttpRequest' ||
    !contentType.toLowerCase().startsWith('application/json')
  ) {
    return json({ error: 'Invalid request origin.' }, 403);
  }

  return null;
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
