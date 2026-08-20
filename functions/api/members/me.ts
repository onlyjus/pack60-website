import { findMemberById } from '../../_lib/db';
import { json } from '../../_lib/http';
import type { AppPagesFunction } from '../../_lib/types';

export const onRequestGet: AppPagesFunction = async (context) => {
  const member = context.data.member;
  const identity = context.data.identity;

  if (!member || !identity) {
    return json({ error: 'Active member access is required.' }, 403);
  }

  const refreshedMember = await findMemberById(context.env.DB, member.id);

  return json({
    member: refreshedMember,
    identity: {
      email: identity.email,
      name: identity.name,
    },
  });
};
