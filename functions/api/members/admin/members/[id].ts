import {
  countActiveAdmins,
  findMemberById,
  writeAuditLog,
} from '../../../../_lib/db';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../../_lib/http';
import { isMemberRole } from '../../../../_lib/security';
import type { AppPagesFunction } from '../../../../_lib/types';

export const onRequestPatch: AppPagesFunction<'id'> = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const targetId = Array.isArray(context.params.id)
    ? context.params.id[0]
    : context.params.id;
  const target = await findMemberById(context.env.DB, targetId);
  if (!target) return json({ error: 'Member account not found.' }, 404);

  const body = await readJsonObject(context.request);
  const action = body?.action;
  const now = new Date().toISOString();

  if (action === 'revoke') {
    if (target.id === actor.id) {
      return json({ error: 'You cannot remove your own access.' }, 400);
    }

    if (
      target.role === 'admin' &&
      target.status === 'active' &&
      (await countActiveAdmins(context.env.DB)) <= 1
    ) {
      return json(
        { error: 'The final active administrator cannot be removed.' },
        409,
      );
    }

    await context.env.DB.prepare(
      `UPDATE members
         SET status = 'revoked', revoked_at = ?, revoked_by_member_id = ?
         WHERE id = ?`,
    )
      .bind(now, actor.id, target.id)
      .run();

    await writeAuditLog(
      context.env.DB,
      actor,
      'member_revoked',
      'member',
      target.id,
      { email: target.email },
    );
  } else if (action === 'reactivate') {
    await context.env.DB.prepare(
      `UPDATE members
         SET status = 'active', activated_at = ?,
             revoked_at = NULL, revoked_by_member_id = NULL
         WHERE id = ?`,
    )
      .bind(now, target.id)
      .run();

    await writeAuditLog(
      context.env.DB,
      actor,
      'member_reactivated',
      'member',
      target.id,
      { email: target.email },
    );
  } else if (action === 'setRole') {
    const role = body?.role;
    if (!isMemberRole(role)) {
      return json({ error: 'Choose a valid member role.' }, 400);
    }

    if (target.id === actor.id && role !== 'admin') {
      return json(
        { error: 'You cannot remove your own administrator role.' },
        400,
      );
    }

    if (
      target.role === 'admin' &&
      role !== 'admin' &&
      target.status === 'active' &&
      (await countActiveAdmins(context.env.DB)) <= 1
    ) {
      return json(
        { error: 'The final active administrator cannot be demoted.' },
        409,
      );
    }

    await context.env.DB.prepare('UPDATE members SET role = ? WHERE id = ?')
      .bind(role, target.id)
      .run();

    await writeAuditLog(
      context.env.DB,
      actor,
      'member_role_changed',
      'member',
      target.id,
      { email: target.email, previousRole: target.role, role },
    );
  } else {
    return json({ error: 'Choose a valid account action.' }, 400);
  }

  return json({ member: await findMemberById(context.env.DB, target.id) });
};
