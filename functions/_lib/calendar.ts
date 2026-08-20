import type { CalendarEventRecord, CalendarEventStatus } from './types';

export interface CalendarEventInput {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  status: CalendarEventStatus;
}

type ValidationResult =
  | { value: CalendarEventInput; error?: never }
  | { value?: never; error: string };

function boundedString(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length <= maximum ? normalized : undefined;
}

function isEventStatus(value: unknown): value is CalendarEventStatus {
  return value === 'planned' || value === 'tentative' || value === 'canceled';
}

export function validateCalendarEventInput(
  body: Record<string, unknown> | null,
): ValidationResult {
  const title = boundedString(body?.title, 140);
  const description = boundedString(body?.description ?? '', 2_000);
  const location = boundedString(body?.location ?? '', 200);
  const startsAt = typeof body?.startsAt === 'string' ? body.startsAt : '';
  const endsAt = typeof body?.endsAt === 'string' ? body.endsAt : '';
  const allDay = body?.allDay ?? false;
  const status = body?.status;
  const startTime = Date.parse(startsAt);
  const endTime = Date.parse(endsAt);

  if (!title || title.length < 2) {
    return { error: 'Enter an event title between 2 and 140 characters.' };
  }
  if (description === undefined) {
    return { error: 'Event details must be 2,000 characters or fewer.' };
  }
  if (location === undefined) {
    return { error: 'The location must be 200 characters or fewer.' };
  }
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return { error: 'Choose valid start and end dates.' };
  }
  if (typeof allDay !== 'boolean') {
    return { error: 'Choose whether this is an all-day event.' };
  }
  if (endTime <= startTime) {
    return { error: 'The event must end after it starts.' };
  }
  if (endTime - startTime > 31 * 24 * 60 * 60 * 1_000) {
    return { error: 'An event may span no more than 31 days.' };
  }
  if (!isEventStatus(status)) {
    return { error: 'Choose a valid event status.' };
  }

  return {
    value: {
      title,
      description,
      location,
      startsAt: new Date(startTime).toISOString(),
      endsAt: new Date(endTime).toISOString(),
      allDay,
      status,
    },
  };
}

export async function listCalendarEvents(
  db: D1Database,
): Promise<CalendarEventRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, title, description, location, starts_at, ends_at, all_day, status,
              created_by_member_id, updated_by_member_id, created_at,
              updated_at, deleted_at
       FROM calendar_events
       WHERE deleted_at IS NULL
       ORDER BY starts_at ASC
       LIMIT 1000`,
    )
    .all<CalendarEventRecord>();

  return result.results;
}

export async function findCalendarEvent(
  db: D1Database,
  id: string,
): Promise<CalendarEventRecord | null> {
  return db
    .prepare(
      `SELECT id, title, description, location, starts_at, ends_at, all_day, status,
              created_by_member_id, updated_by_member_id, created_at,
              updated_at, deleted_at
       FROM calendar_events
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
    )
    .bind(id)
    .first<CalendarEventRecord>();
}
