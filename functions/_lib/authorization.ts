import {
  ensureBootstrapAdmin,
  findMemberByEmail,
  recordMemberActivity,
} from './db';
import { getAccessIdentity } from './identity';
import { json, memberAppOrigin, withPrivateHeaders } from './http';
import type { AppData, Env } from './types';

interface AuthorizationOptions {
  allowUnprovisioned?: boolean;
  adminOnly?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function messagePage(options: {
  title: string;
  eyebrow: string;
  message: string;
  actionHref: string;
  actionLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  status: number;
}): Response {
  const secondary = options.secondaryHref
    ? `<a class="secondary" href="${escapeHtml(options.secondaryHref)}">${escapeHtml(options.secondaryLabel ?? 'Go back')}</a>`
    : '';

  return withPrivateHeaders(
    new Response(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${escapeHtml(options.title)} | Cub Scout Pack 60</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fbf7ef; color: #17231f; padding: 1rem; }
      main { width: min(620px, 100%); border: 1px solid #d9e2dc; border-radius: 12px; background: #fff; box-shadow: 0 18px 45px rgba(18,60,47,.1); padding: clamp(1.5rem, 6vw, 3rem); }
      .eyebrow { margin: 0 0 .5rem; color: #9b6d00; font-size: .78rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 0 0 1rem; color: #123c2f; font-size: clamp(2rem, 7vw, 3.3rem); line-height: 1.05; }
      p { color: #51635d; font-size: 1.05rem; line-height: 1.65; }
      .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.5rem; }
      a { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; border-radius: 999px; padding: .7rem 1rem; color: #fff; background: #123c2f; font-weight: 800; text-decoration: none; }
      a.secondary { border: 1px solid #d9e2dc; background: #fff; color: #123c2f; }
      a:focus-visible { outline: 3px solid #f4c542; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">${escapeHtml(options.eyebrow)}</p>
      <h1>${escapeHtml(options.title)}</h1>
      <p>${escapeHtml(options.message)}</p>
      <div class="actions">
        <a href="${escapeHtml(options.actionHref)}">${escapeHtml(options.actionLabel)}</a>
        ${secondary}
      </div>
    </main>
  </body>
</html>`,
      {
        status: options.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    ),
  );
}

function isApiRequest(request: Request): boolean {
  return new URL(request.url).pathname.startsWith('/api/');
}

export async function authorizeMemberRequest(
  context: EventContext<Env, string, AppData>,
  options: AuthorizationOptions = {},
): Promise<Response> {
  const apiRequest = isApiRequest(context.request);
  const requestUrl = new URL(context.request.url);
  const appOrigin = memberAppOrigin(context.env, context.request);
  const isDevelopment = context.env.ENVIRONMENT !== 'production';

  if (!apiRequest && !isDevelopment && requestUrl.origin !== appOrigin) {
    return Response.redirect(
      new URL(
        `${requestUrl.pathname}${requestUrl.search}`,
        appOrigin,
      ).toString(),
      307,
    );
  }

  let identity;

  try {
    identity = await getAccessIdentity(context.env, context.request);
  } catch (error) {
    console.error('Cloudflare Access token validation failed.', error);
    return apiRequest
      ? json({ error: 'Member authentication could not be verified.' }, 401)
      : messagePage({
          title: 'Sign-in could not be verified',
          eyebrow: 'Member access',
          message:
            'The secure member sign-in could not be verified. Please sign out and try again.',
          actionHref: `${memberAppOrigin(context.env, context.request)}/cdn-cgi/access/logout`,
          actionLabel: 'Sign out and retry',
          status: 401,
        });
  }

  if (!identity) {
    return apiRequest
      ? json({ error: 'Sign in is required.' }, 401)
      : messagePage({
          title: 'Member sign-in required',
          eyebrow: 'Pack 60 families',
          message:
            'Use the secure Pack 60 member sign-in to continue. Cloudflare Access will verify your Google account or email.',
          actionHref: `${appOrigin}/members/`,
          actionLabel: 'Member login',
          secondaryHref: 'https://pack60.org/',
          secondaryLabel: 'Return to public site',
          status: 401,
        });
  }

  context.data.identity = identity;

  try {
    await ensureBootstrapAdmin(context.env, identity);
    const member = await findMemberByEmail(context.env.DB, identity.email);

    if (member?.status === 'active') {
      await recordMemberActivity(context.env.DB, member, identity);
      context.data.member = member;
    }

    if (options.allowUnprovisioned) {
      return withPrivateHeaders(await context.next());
    }

    if (!member || member.status !== 'active') {
      return apiRequest
        ? json(
            { error: 'This account does not have active member access.' },
            403,
          )
        : messagePage({
            title: 'An invitation is required',
            eyebrow: 'Member access',
            message: `You signed in as ${identity.email}, but this account does not have active Pack 60 access. Open the invitation sent by a pack administrator, or ask an administrator for a new one.`,
            actionHref: `${memberAppOrigin(context.env, context.request)}/members/join/`,
            actionLabel: 'Redeem an invitation',
            secondaryHref: `${memberAppOrigin(context.env, context.request)}/cdn-cgi/access/logout`,
            secondaryLabel: 'Use another account',
            status: 403,
          });
    }

    if (options.adminOnly && member.role !== 'admin') {
      return apiRequest
        ? json({ error: 'Administrator access is required.' }, 403)
        : messagePage({
            title: 'Administrator access required',
            eyebrow: 'Pack 60 administration',
            message:
              'Your member account is active, but this page is limited to Pack 60 administrators.',
            actionHref: `${memberAppOrigin(context.env, context.request)}/members/`,
            actionLabel: 'Return to member area',
            status: 403,
          });
    }

    return withPrivateHeaders(await context.next());
  } catch (error) {
    console.error('Member authorization failed.', error);
    return apiRequest
      ? json({ error: 'The member service is temporarily unavailable.' }, 503)
      : messagePage({
          title: 'Member service unavailable',
          eyebrow: 'Temporary problem',
          message:
            'The private member service could not load. Please wait a moment and try again.',
          actionHref: context.request.url,
          actionLabel: 'Try again',
          status: 503,
        });
  }
}
