import { findMemberByEmail } from '../../../_lib/db';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../_lib/http';
import { hashInviteToken } from '../../../_lib/security';
import type { AppPagesFunction } from '../../../_lib/types';

export const onRequestPost: AppPagesFunction = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const identity = context.data.identity;
  if (!identity)
    return json({ error: 'Sign in before redeeming an invitation.' }, 401);

  const body = await readJsonObject(context.request);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (token.length < 32 || token.length > 200) {
    return json({ error: 'This invitation link is not valid.' }, 400);
  }

  const tokenHash = await hashInviteToken(token);
  const now = new Date().toISOString();
  const nonce = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const auditId = crypto.randomUUID();

  const results = await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE member_invites
         SET use_count = 1,
             redeemed_at = ?,
             redeemed_by_email = ?,
             redemption_nonce = ?
         WHERE token_hash = ?
           AND email = ?
           AND use_count = 0
           AND redeemed_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > ?`,
    ).bind(now, identity.email, nonce, tokenHash, identity.email, now),
    context.env.DB.prepare(
      `INSERT INTO members (
           id, email, display_name, access_subject, role, status,
           created_at, activated_at, last_login_at, last_seen_at,
           invited_by_member_id
         )
         SELECT ?, invite.email, ?, ?, invite.role, 'active', ?, ?, ?, ?,
                invite.created_by_member_id
         FROM member_invites AS invite
         WHERE invite.token_hash = ? AND invite.redemption_nonce = ?
         ON CONFLICT(email) DO UPDATE SET
           display_name = COALESCE(excluded.display_name, members.display_name),
           access_subject = excluded.access_subject,
           role = excluded.role,
           status = 'active',
           activated_at = excluded.activated_at,
           last_login_at = excluded.last_login_at,
           last_seen_at = excluded.last_seen_at,
           invited_by_member_id = excluded.invited_by_member_id,
           revoked_at = NULL,
           revoked_by_member_id = NULL`,
    ).bind(
      memberId,
      identity.name,
      identity.subject,
      now,
      now,
      identity.loginAt,
      now,
      tokenHash,
      nonce,
    ),
    context.env.DB.prepare(
      `UPDATE member_invites
         SET redeemed_by_member_id = (
           SELECT id FROM members WHERE email = member_invites.email
         )
         WHERE token_hash = ? AND redemption_nonce = ?`,
    ).bind(tokenHash, nonce),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         )
         SELECT ?, member.id, member.email, 'invite_redeemed', 'invite',
                invite.id, NULL, ?
         FROM member_invites AS invite
         JOIN members AS member ON member.email = invite.email
         WHERE invite.token_hash = ? AND invite.redemption_nonce = ?`,
    ).bind(auditId, now, tokenHash, nonce),
  ]);

  if (Number(results[0].meta.changes ?? 0) !== 1) {
    return json(
      {
        error:
          'This invitation is invalid, expired, already used, or assigned to another email address.',
      },
      400,
    );
  }

  const member = await findMemberByEmail(context.env.DB, identity.email);
  if (!member || member.status !== 'active') {
    return json({ error: 'Member access could not be activated.' }, 500);
  }

  return json({ success: true, member });
};
