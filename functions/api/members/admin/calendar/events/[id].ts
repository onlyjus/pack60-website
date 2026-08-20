import {
  findCalendarEvent,
  validateCalendarEventInput,
} from '../../../../../_lib/calendar';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../../../_lib/http';
import type { AppPagesFunction } from '../../../../../_lib/types';

function eventId(context: EventContext<CloudflareEnv, 'id', unknown>): string {
  return Array.isArray(context.params.id)
    ? context.params.id[0]
    : context.params.id;
}

export const onRequestPatch: AppPagesFunction<'id'> = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const id = eventId(context);
  const existing = await findCalendarEvent(context.env.DB, id);
  if (!existing) return json({ error: 'Calendar event not found.' }, 404);

  const validated = validateCalendarEventInput(
    await readJsonObject(context.request),
  );
  if ('error' in validated) return json({ error: validated.error }, 400);

  const event = validated.value;
  const now = new Date().toISOString();
  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE calendar_events
         SET title = ?, description = ?, location = ?, starts_at = ?,
             ends_at = ?, all_day = ?, status = ?, updated_by_member_id = ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
    ).bind(
      event.title,
      event.description,
      event.location,
      event.startsAt,
      event.endsAt,
      event.allDay ? 1 : 0,
      event.status,
      actor.id,
      now,
      id,
    ),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'calendar_event_updated', 'calendar_event', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      id,
      JSON.stringify({ title: event.title, previousTitle: existing.title }),
      now,
    ),
  ]);

  return json({ event: await findCalendarEvent(context.env.DB, id) });
};

export const onRequestDelete: AppPagesFunction<'id'> = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const id = eventId(context);
  const existing = await findCalendarEvent(context.env.DB, id);
  if (!existing) return json({ error: 'Calendar event not found.' }, 404);

  const now = new Date().toISOString();
  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE calendar_events
         SET deleted_at = ?, updated_by_member_id = ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
    ).bind(now, actor.id, now, id),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'calendar_event_deleted', 'calendar_event', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      id,
      JSON.stringify({ title: existing.title }),
      now,
    ),
  ]);

  return json({ success: true });
};
