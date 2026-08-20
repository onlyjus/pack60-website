import { createRemoteJWKSet, jwtVerify } from 'jose';
import { normalizeEmail } from './security';
import type { AccessIdentity, Env } from './types';

const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function localIdentity(env: Env, request: Request): AccessIdentity | null {
  const bypassEnabled =
    env.ENVIRONMENT !== 'production' && env.LOCAL_AUTH_BYPASS === 'true';
  const email = env.LOCAL_AUTH_EMAIL?.trim();

  if (!bypassEnabled || !email) {
    return null;
  }

  return {
    email: normalizeEmail(email),
    name: 'Local administrator',
    subject: `local:${normalizeEmail(email)}`,
    loginAt: new Date().toISOString(),
  };
}

function normalizeTeamOrigin(teamDomain: string): string {
  const withProtocol = /^https?:\/\//iu.test(teamDomain)
    ? teamDomain
    : `https://${teamDomain}`;
  return withProtocol.replace(/\/$/u, '');
}

export async function getAccessIdentity(
  env: Env,
  request: Request,
): Promise<AccessIdentity | null> {
  const local = localIdentity(env, request);
  if (local) {
    return local;
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) {
    return null;
  }

  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    throw new Error(
      'Cloudflare Access is missing CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD.',
    );
  }

  const teamOrigin = normalizeTeamOrigin(env.CF_ACCESS_TEAM_DOMAIN);
  let jwks = jwksByTeam.get(teamOrigin);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${teamOrigin}/cdn-cgi/access/certs`));
    jwksByTeam.set(teamOrigin, jwks);
  }

  const { payload } = await jwtVerify(token, jwks, {
    audience: env.CF_ACCESS_AUD,
    issuer: teamOrigin,
  });

  if (typeof payload.email !== 'string' || typeof payload.sub !== 'string') {
    return null;
  }

  const loginAt = payload.iat
    ? new Date(payload.iat * 1000).toISOString()
    : new Date().toISOString();

  return {
    email: normalizeEmail(payload.email),
    name: typeof payload.name === 'string' ? payload.name : null,
    subject: payload.sub,
    loginAt,
  };
}
