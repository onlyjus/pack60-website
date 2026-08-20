import { json, requireSameOriginMutation } from '../../../_lib/http';
import { createSecureToken, hashSecretToken } from '../../../_lib/security';
import type {
  AppPagesFunction,
  CalendarSubscriptionRecord,
} from '../../../_lib/types';

async function findSubscription(
  db: D1Database,
  memberId: string,
): Promise<CalendarSubscriptionRecord | null> {
  return db
    .prepare(
      `SELECT member_id, created_at, rotated_at, revoked_at
       FROM calendar_subscriptions
       WHERE member_id = ?
       LIMIT 1`,
    )
    .bind(memberId)
    .first<CalendarSubscriptionRecord>();
}

export const onRequestGet: AppPagesFunction = async (context) => {
  const member = context.data.member;
  if (!member) return json({ error: 'Active member access is required.' }, 403);

  const subscription = await findSubscription(context.env.DB, member.id);
  return json({
    subscription: subscription
      ? {
          active: subscription.revoked_at === null,
          createdAt: subscription.created_at,
          rotatedAt: subscription.rotated_at,
        }
      : null,
  });
};

export const onRequestPost: AppPagesFunction = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const member = context.data.member;
  if (!member) return json({ error: 'Active member access is required.' }, 403);

  const token = createSecureToken();
  const tokenHash = await hashSecretToken(token);
  const now = new Date().toISOString();

  await context.env.DB.batch([
    context.env.DB.prepare(
      `INSERT INTO calendar_subscriptions (
           member_id, token_hash, created_at, rotated_at, revoked_at
         ) VALUES (?, ?, ?, ?, NULL)
         ON CONFLICT(member_id) DO UPDATE SET
           token_hash = excluded.token_hash,
           rotated_at = excluded.rotated_at,
           revoked_at = NULL`,
    ).bind(member.id, tokenHash, now, now),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'calendar_subscription_rotated',
                   'calendar_subscription', ?, NULL, ?)`,
    ).bind(crypto.randomUUID(), member.id, member.email, member.id, now),
  ]);

  const feedUrl = new URL('/calendar/feed.ics', 'https://pack60.org');
  feedUrl.searchParams.set('token', token);

  return json({
    subscription: { active: true, createdAt: now, rotatedAt: now },
    feedUrl: feedUrl.toString(),
    notice: 'This private subscription link is shown only once.',
  });
};

export const onRequestDelete: AppPagesFunction = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const member = context.data.member;
  if (!member) return json({ error: 'Active member access is required.' }, 403);

  const now = new Date().toISOString();
  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE calendar_subscriptions
         SET revoked_at = ?
         WHERE member_id = ? AND revoked_at IS NULL`,
    ).bind(now, member.id),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'calendar_subscription_revoked',
                   'calendar_subscription', ?, NULL, ?)`,
    ).bind(crypto.randomUUID(), member.id, member.email, member.id, now),
  ]);

  return json({ success: true });
};
