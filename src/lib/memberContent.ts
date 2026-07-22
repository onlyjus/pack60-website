import type { CollectionEntry } from 'astro:content';

export type MemberEvent = CollectionEntry<'member-events'>;
export type PhotoAlbum = CollectionEntry<'photo-albums'>;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeZone: 'America/New_York',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/New_York',
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'America/New_York',
});

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseMemberDate(value: string): Date {
  if (dateOnlyPattern.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  return new Date(value);
}

function timestamp(value: string): number {
  return parseMemberDate(value).getTime();
}

function sameCalendarDay(first: Date, second: Date): boolean {
  return shortDateFormatter.format(first) === shortDateFormatter.format(second);
}

export function formatEventDateRange(event: MemberEvent): string {
  const start = parseMemberDate(event.data.startDate);
  const end = event.data.endDate ? parseMemberDate(event.data.endDate) : null;
  const startIsDateOnly = dateOnlyPattern.test(event.data.startDate);
  const endIsDateOnly = event.data.endDate
    ? dateOnlyPattern.test(event.data.endDate)
    : false;

  if (!end) {
    if (startIsDateOnly) {
      return dateFormatter.format(start);
    }

    return `${dateFormatter.format(start)} at ${timeFormatter.format(start)}`;
  }

  if (startIsDateOnly && endIsDateOnly) {
    if (sameCalendarDay(start, end)) {
      return dateFormatter.format(start);
    }

    return `${dateFormatter.format(start)} to ${dateFormatter.format(end)}`;
  }

  if (sameCalendarDay(start, end)) {
    if (startIsDateOnly || endIsDateOnly) {
      return dateFormatter.format(start);
    }

    return `${dateFormatter.format(start)}, ${timeFormatter.format(start)} to ${timeFormatter.format(end)}`;
  }

  return `${dateFormatter.format(start)} at ${timeFormatter.format(start)} to ${dateFormatter.format(end)} at ${timeFormatter.format(end)}`;
}

export function formatShortEventDate(event: MemberEvent): string {
  const start = parseMemberDate(event.data.startDate);
  return shortDateFormatter.format(start);
}

export function formatAlbumDate(album: PhotoAlbum): string {
  return shortDateFormatter.format(parseMemberDate(album.data.eventDate));
}

export function formatEventMonth(event: MemberEvent): string {
  return monthFormatter.format(parseMemberDate(event.data.startDate));
}

export function isUpcomingEvent(event: MemberEvent, now = new Date()): boolean {
  const end = event.data.endDate ?? event.data.startDate;
  return timestamp(end) >= now.getTime();
}

export function sortEventsAscending(
  first: MemberEvent,
  second: MemberEvent,
): number {
  return timestamp(first.data.startDate) - timestamp(second.data.startDate);
}

export function sortEventsDescending(
  first: MemberEvent,
  second: MemberEvent,
): number {
  return timestamp(second.data.startDate) - timestamp(first.data.startDate);
}

export function sortAlbumsDescending(
  first: PhotoAlbum,
  second: PhotoAlbum,
): number {
  return timestamp(second.data.eventDate) - timestamp(first.data.eventDate);
}

export function statusLabel(status: MemberEvent['data']['status']): string {
  const labels: Record<MemberEvent['data']['status'], string> = {
    planned: 'Planned',
    tentative: 'Tentative',
    updated: 'Updated',
    canceled: 'Canceled',
  };

  return labels[status];
}
