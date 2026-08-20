import { createInvite, findMemberByEmail, listInvites } from '../../../_lib/db';
import {
  json,
  memberAppOrigin,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../_lib/http';
import {
  createInviteToken,
  hashInviteToken,
  isMemberRole,
  isValidEmail,
  normalizeEmail,
} from '../../../_lib/security';
import type { AppPagesFunction } from '../../../_lib/types';

export const onRequestGet: AppPagesFunction = async (context) => {
  const invites = await listInvites(context.env.DB);
  return json({ invites });
};

export const onRequestPost: AppPagesFunction = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const body = await readJsonObject(context.request);
  const rawEmail = typeof body?.email === 'string' ? body.email : '';
  const email = normalizeEmail(rawEmail);
  const role = body?.role ?? 'member';
  const requestedDays =
    typeof body?.expiresInDays === 'number' ? body.expiresInDays : 7;
  const expiresInDays = Math.trunc(requestedDays);

  if (!isValidEmail(email)) {
    return json({ error: 'Enter a valid email address.' }, 400);
  }

  if (!isMemberRole(role)) {
    return json({ error: 'Choose a valid member role.' }, 400);
  }

  if (expiresInDays < 1 || expiresInDays > 30) {
    return json({ error: 'Invitations may be valid for 1 to 30 days.' }, 400);
  }

  const existingMember = await findMemberByEmail(context.env.DB, email);
  if (existingMember?.status === 'active') {
    return json({ error: 'That email already has active member access.' }, 409);
  }

  const token = createInviteToken();
  const tokenHash = await hashInviteToken(token);
  const id = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  await createInvite(context.env.DB, actor, {
    id,
    email,
    role,
    tokenHash,
    expiresAt,
  });

  const inviteUrl = new URL(
    '/members/join/',
    memberAppOrigin(context.env, context.request),
  );
  inviteUrl.searchParams.set('token', token);

  return json(
    {
      invite: { id, email, role, expiresAt },
      inviteUrl: inviteUrl.toString(),
      notice: 'This link is shown once. Create a replacement if it is lost.',
    },
    201,
  );
};
