import { onRequest as rootHandler } from '../functions/index';
import { json } from '../functions/_lib/http';
import type { AppData, AppPagesFunction, Env } from '../functions/_lib/types';
import { onRequest as memberMiddleware } from '../functions/members/_middleware';
import { onRequest as apiMiddleware } from '../functions/api/members/_middleware';
import { onRequestGet as meGet } from '../functions/api/members/me';
import { onRequestPost as redeemInvitePost } from '../functions/api/members/invites/redeem';
import { onRequestGet as adminMembersGet } from '../functions/api/members/admin/members';
import { onRequestPatch as adminMemberPatch } from '../functions/api/members/admin/members/[id]';
import {
  onRequestGet as adminInvitesGet,
  onRequestPost as adminInvitesPost,
} from '../functions/api/members/admin/invites';
import { onRequestPatch as adminInvitePatch } from '../functions/api/members/admin/invites/[id]';
import { onRequestGet as calendarEventsGet } from '../functions/api/members/calendar/events';
import {
  onRequestDelete as calendarSubscriptionDelete,
  onRequestGet as calendarSubscriptionGet,
  onRequestPost as calendarSubscriptionPost,
} from '../functions/api/members/calendar/subscription';
import { onRequestPost as adminCalendarEventPost } from '../functions/api/members/admin/calendar/events';
import {
  onRequestDelete as adminCalendarEventDelete,
  onRequestPatch as adminCalendarEventPatch,
} from '../functions/api/members/admin/calendar/events/[id]';
import { onRequestGet as budgetGet } from '../functions/api/members/budget';
import { onRequestPost as adminBudgetItemPost } from '../functions/api/members/admin/budget/items';
import {
  onRequestDelete as adminBudgetItemDelete,
  onRequestPatch as adminBudgetItemPatch,
} from '../functions/api/members/admin/budget/items/[id]';
import { onRequestGet as calendarFeedGet } from '../functions/calendar/feed.ics';

interface RouteRuntime {
  request: IncomingRequest;
  env: Env;
  executionContext: ExecutionContext;
  data: AppData;
}

type IncomingRequest = EventContext<Env, string, AppData>['request'];
type NextHandler = (request: IncomingRequest) => Promise<Response>;

function nextRequest(
  current: IncomingRequest,
  input?: Request | string,
  init?: RequestInit,
): IncomingRequest {
  if (!input) {
    return (init ? new Request(current, init) : current) as IncomingRequest;
  }
  if (input instanceof Request) {
    return (init ? new Request(input, init) : input) as IncomingRequest;
  }
  return new Request(new URL(input, current.url), init) as IncomingRequest;
}

async function invokePagesHandler<P extends string>(
  handler: AppPagesFunction<P>,
  runtime: RouteRuntime,
  params: Record<P, string | string[]>,
  next: NextHandler,
): Promise<Response> {
  return handler({
    request: runtime.request,
    functionPath: new URL(runtime.request.url).pathname,
    waitUntil: runtime.executionContext.waitUntil.bind(
      runtime.executionContext,
    ),
    passThroughOnException:
      runtime.executionContext.passThroughOnException.bind(
        runtime.executionContext,
      ),
    next: async (input, init) =>
      next(nextRequest(runtime.request, input, init)),
    env: runtime.env,
    params,
    data: runtime.data,
  });
}

function methodNotAllowed(allowed: string[]): Response {
  const response = json({ error: 'Method not allowed.' }, 405);
  response.headers.set('Allow', allowed.join(', '));
  return response;
}

function apiNotFound(): Response {
  return json({ error: 'Member API endpoint not found.' }, 404);
}

async function routeMemberApi(runtime: RouteRuntime): Promise<Response> {
  const { pathname } = new URL(runtime.request.url);
  const method = runtime.request.method.toUpperCase();
  const noParams = {} as Record<string, string | string[]>;

  if (pathname === '/api/members/me') {
    return method === 'GET'
      ? invokePagesHandler(meGet, runtime, noParams, async () => apiNotFound())
      : methodNotAllowed(['GET']);
  }

  if (pathname === '/api/members/invites/redeem') {
    return method === 'POST'
      ? invokePagesHandler(redeemInvitePost, runtime, noParams, async () =>
          apiNotFound(),
        )
      : methodNotAllowed(['POST']);
  }

  if (pathname === '/api/members/calendar/events') {
    return method === 'GET'
      ? invokePagesHandler(calendarEventsGet, runtime, noParams, async () =>
          apiNotFound(),
        )
      : methodNotAllowed(['GET']);
  }

  if (pathname === '/api/members/calendar/subscription') {
    if (method === 'GET') {
      return invokePagesHandler(
        calendarSubscriptionGet,
        runtime,
        noParams,
        async () => apiNotFound(),
      );
    }
    if (method === 'POST') {
      return invokePagesHandler(
        calendarSubscriptionPost,
        runtime,
        noParams,
        async () => apiNotFound(),
      );
    }
    if (method === 'DELETE') {
      return invokePagesHandler(
        calendarSubscriptionDelete,
        runtime,
        noParams,
        async () => apiNotFound(),
      );
    }
    return methodNotAllowed(['GET', 'POST', 'DELETE']);
  }

  if (pathname === '/api/members/budget') {
    return method === 'GET'
      ? invokePagesHandler(budgetGet, runtime, noParams, async () =>
          apiNotFound(),
        )
      : methodNotAllowed(['GET']);
  }

  if (pathname === '/api/members/admin/calendar/events') {
    return method === 'POST'
      ? invokePagesHandler(
          adminCalendarEventPost,
          runtime,
          noParams,
          async () => apiNotFound(),
        )
      : methodNotAllowed(['POST']);
  }

  const calendarEventMatch = pathname.match(
    /^\/api\/members\/admin\/calendar\/events\/([^/]+)\/?$/u,
  );
  if (calendarEventMatch) {
    const params = { id: decodeURIComponent(calendarEventMatch[1]) };
    if (method === 'PATCH') {
      return invokePagesHandler(
        adminCalendarEventPatch,
        runtime,
        params,
        async () => apiNotFound(),
      );
    }
    if (method === 'DELETE') {
      return invokePagesHandler(
        adminCalendarEventDelete,
        runtime,
        params,
        async () => apiNotFound(),
      );
    }
    return methodNotAllowed(['PATCH', 'DELETE']);
  }

  if (pathname === '/api/members/admin/budget/items') {
    return method === 'POST'
      ? invokePagesHandler(adminBudgetItemPost, runtime, noParams, async () =>
          apiNotFound(),
        )
      : methodNotAllowed(['POST']);
  }

  const budgetItemMatch = pathname.match(
    /^\/api\/members\/admin\/budget\/items\/([^/]+)\/?$/u,
  );
  if (budgetItemMatch) {
    const params = { id: decodeURIComponent(budgetItemMatch[1]) };
    if (method === 'PATCH') {
      return invokePagesHandler(
        adminBudgetItemPatch,
        runtime,
        params,
        async () => apiNotFound(),
      );
    }
    if (method === 'DELETE') {
      return invokePagesHandler(
        adminBudgetItemDelete,
        runtime,
        params,
        async () => apiNotFound(),
      );
    }
    return methodNotAllowed(['PATCH', 'DELETE']);
  }

  if (pathname === '/api/members/admin/members') {
    return method === 'GET'
      ? invokePagesHandler(adminMembersGet, runtime, noParams, async () =>
          apiNotFound(),
        )
      : methodNotAllowed(['GET']);
  }

  const memberMatch = pathname.match(
    /^\/api\/members\/admin\/members\/([^/]+)\/?$/u,
  );
  if (memberMatch) {
    return method === 'PATCH'
      ? invokePagesHandler(
          adminMemberPatch,
          runtime,
          { id: decodeURIComponent(memberMatch[1]) },
          async () => apiNotFound(),
        )
      : methodNotAllowed(['PATCH']);
  }

  if (pathname === '/api/members/admin/invites') {
    if (method === 'GET') {
      return invokePagesHandler(adminInvitesGet, runtime, noParams, async () =>
        apiNotFound(),
      );
    }
    if (method === 'POST') {
      return invokePagesHandler(adminInvitesPost, runtime, noParams, async () =>
        apiNotFound(),
      );
    }
    return methodNotAllowed(['GET', 'POST']);
  }

  const inviteMatch = pathname.match(
    /^\/api\/members\/admin\/invites\/([^/]+)\/?$/u,
  );
  if (inviteMatch) {
    return method === 'PATCH'
      ? invokePagesHandler(
          adminInvitePatch,
          runtime,
          { id: decodeURIComponent(inviteMatch[1]) },
          async () => apiNotFound(),
        )
      : methodNotAllowed(['PATCH']);
  }

  return apiNotFound();
}

async function handleRequest(
  request: IncomingRequest,
  env: Env,
  executionContext: ExecutionContext,
): Promise<Response> {
  const runtime: RouteRuntime = {
    request,
    env,
    executionContext,
    data: {},
  };
  const pathname = new URL(request.url).pathname;
  const noParams = {} as Record<string, string | string[]>;
  const asset = (assetRequest: Request) => env.ASSETS.fetch(assetRequest);

  if (pathname === '/calendar/feed.ics') {
    return request.method === 'GET'
      ? invokePagesHandler(calendarFeedGet, runtime, noParams, async () =>
          apiNotFound(),
        )
      : methodNotAllowed(['GET']);
  }

  if (pathname === '/') {
    return invokePagesHandler(rootHandler, runtime, noParams, asset);
  }

  if (pathname === '/members' || pathname.startsWith('/members/')) {
    return invokePagesHandler(memberMiddleware, runtime, noParams, asset);
  }

  if (pathname === '/api/members' || pathname.startsWith('/api/members/')) {
    return invokePagesHandler(apiMiddleware, runtime, noParams, async () =>
      routeMemberApi(runtime),
    );
  }

  return asset(request);
}

export default {
  fetch(request, env, executionContext) {
    return handleRequest(request, env, executionContext);
  },
} satisfies ExportedHandler<Env>;
