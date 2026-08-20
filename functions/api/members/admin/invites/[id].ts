import { writeAuditLog } from '../../../../_lib/db';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../../_lib/http';
import type { AppPagesFunction } from '../../../../_lib/types';

export const onRequestPatch: AppPagesFunction<'id'> = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const inviteId = Array.isArray(context.params.id)
    ? context.params.id[0]
    : context.params.id;

  const body = await readJsonObject(context.request);
  if (body?.action !== 'revoke') {
    return json({ error: 'Choose a valid invitation action.' }, 400);
  }

  const invite = await context.env.DB.prepare(
    `SELECT id, email, redeemed_at, revoked_at
       FROM member_invites
       WHERE id = ?
       LIMIT 1`,
  )
    .bind(inviteId)
    .first<{
      id: string;
      email: string;
      redeemed_at: string | null;
      revoked_at: string | null;
    }>();

  if (!invite) return json({ error: 'Invitation not found.' }, 404);
  if (invite.redeemed_at) {
    return json({ error: 'A redeemed invitation cannot be revoked.' }, 409);
  }

  if (!invite.revoked_at) {
    await context.env.DB.prepare(
      `UPDATE member_invites
         SET revoked_at = ?, revoked_by_member_id = ?
         WHERE id = ? AND redeemed_at IS NULL AND revoked_at IS NULL`,
    )
      .bind(new Date().toISOString(), actor.id, invite.id)
      .run();

    await writeAuditLog(
      context.env.DB,
      actor,
      'invite_revoked',
      'invite',
      invite.id,
      { email: invite.email },
    );
  }

  return json({ success: true });
};
