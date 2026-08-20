import { authorizeMemberRequest } from '../../_lib/authorization';
import type { AppPagesFunction } from '../../_lib/types';

export const onRequest: AppPagesFunction = async (context) => {
  const pathname = new URL(context.request.url).pathname.replace(/\/$/u, '');

  return authorizeMemberRequest(context, {
    allowUnprovisioned: pathname === '/api/members/invites/redeem',
    adminOnly:
      pathname === '/api/members/admin' ||
      pathname.startsWith('/api/members/admin/'),
  });
};
