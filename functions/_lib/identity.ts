import type { Env, IdentityContext } from './types';

const COOKIE_NAME = 'anon_id';

function getCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== key) continue;
    return rest.join('=') || null;
  }
  return null;
}

export function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '0.0.0.0';
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getIdentityContext(request: Request, env: Env): Promise<IdentityContext> {
  const cookieHeader = request.headers.get('cookie');
  let anonId = getCookieValue(cookieHeader, COOKIE_NAME);
  let setCookieHeader: string | undefined;

  if (!anonId || !/^[a-zA-Z0-9_-]{20,}$/.test(anonId)) {
    anonId = crypto.randomUUID().replace(/-/g, '');
    setCookieHeader = `${COOKIE_NAME}=${anonId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
  }

  const ip = getClientIp(request);
  const anonHash = await sha256Hex(`${anonId}:${env.VOTE_PEPPER}`);
  const ipHash = await sha256Hex(`${ip}:${env.VOTE_PEPPER}`);

  return {
    anonId,
    anonHash,
    ipHash,
    setCookieHeader
  };
}

export function withIdentityCookie(response: Response, identity: IdentityContext): Response {
  if (!identity.setCookieHeader) return response;
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', identity.setCookieHeader);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
