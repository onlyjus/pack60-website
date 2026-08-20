import {
  findCalendarEvent,
  validateCalendarEventInput,
} from '../../../../_lib/calendar';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../../_lib/http';
import type { AppPagesFunction } from '../../../../_lib/types';

export const onRequestPost: AppPagesFunction = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const validated = validateCalendarEventInput(
    await readJsonObject(context.request),
  );
  if ('error' in validated) return json({ error: validated.error }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const event = validated.value;

  await context.env.DB.batch([
    context.env.DB.prepare(
      `INSERT INTO calendar_events (
           id, title, description, location, starts_at, ends_at, all_day, status,
           created_by_member_id, updated_by_member_id, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      event.title,
      event.description,
      event.location,
      event.startsAt,
      event.endsAt,
      event.allDay ? 1 : 0,
      event.status,
      actor.id,
      actor.id,
      now,
      now,
    ),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'calendar_event_created', 'calendar_event', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      id,
      JSON.stringify({
        title: event.title,
        startsAt: event.startsAt,
        allDay: event.allDay,
      }),
      now,
    ),
  ]);

  return json({ event: await findCalendarEvent(context.env.DB, id) }, 201);
};
