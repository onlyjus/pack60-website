import { listCalendarEvents } from '../_lib/calendar';
import { buildCalendarFeed } from '../_lib/ical';
import { hashSecretToken } from '../_lib/security';
import type { AppPagesFunction } from '../_lib/types';

function notFound(): Response {
  return new Response('Calendar subscription not found.', {
    status: 404,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const onRequestGet: AppPagesFunction = async (context) => {
  const token = new URL(context.request.url).searchParams.get('token') ?? '';
  if (token.length < 40 || token.length > 200) return notFound();

  const tokenHash = await hashSecretToken(token);
  const subscription = await context.env.DB.prepare(
    `SELECT subscription.member_id
     FROM calendar_subscriptions AS subscription
     JOIN members AS member ON member.id = subscription.member_id
     WHERE subscription.token_hash = ?
       AND subscription.revoked_at IS NULL
       AND member.status = 'active'
     LIMIT 1`,
  )
    .bind(tokenHash)
    .first<{ member_id: string }>();

  if (!subscription) return notFound();

  const feed = buildCalendarFeed(await listCalendarEvents(context.env.DB));
  return new Response(feed, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline; filename="pack60-private-calendar.ics"',
      'Content-Type': 'text/calendar; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};
