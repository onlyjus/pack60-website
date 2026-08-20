import { listMembers } from '../../../_lib/db';
import { json } from '../../../_lib/http';
import type { AppPagesFunction } from '../../../_lib/types';

export const onRequestGet: AppPagesFunction = async (context) => {
  const members = await listMembers(context.env.DB);
  const activeCount = members.filter(
    (member) => member.status === 'active',
  ).length;
  const adminCount = members.filter(
    (member) => member.status === 'active' && member.role === 'admin',
  ).length;

  return json({
    members,
    summary: {
      activeCount,
      adminCount,
      revokedCount: members.length - activeCount,
    },
  });
};
