import { memberAppOrigin } from './_lib/http';
import type { AppPagesFunction } from './_lib/types';

export const onRequest: AppPagesFunction = async (context) => {
  const requestUrl = new URL(context.request.url);
  const appOrigin = memberAppOrigin(context.env, context.request);

  if (requestUrl.origin === appOrigin && requestUrl.pathname === '/') {
    return Response.redirect(new URL('/members/', appOrigin).toString(), 302);
  }

  return context.next();
};
