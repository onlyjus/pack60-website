import type { CalendarEventRecord } from './types';

const CRLF = '\r\n';
const encoder = new TextEncoder();

function escapeText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(/\r?\n/gu, '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;');
}

function utcStamp(value: string): string {
  return new Date(value)
    .toISOString()
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replace(/\.\d{3}Z$/u, 'Z');
}

function foldLine(line: string): string {
  const chunks: string[] = [];
  let current = '';

  for (const character of line) {
    const maximum = chunks.length === 0 ? 75 : 74;
    if (current && encoder.encode(current + character).byteLength > maximum) {
      chunks.push(current);
      current = character;
    } else {
      current += character;
    }
  }
  chunks.push(current);

  return chunks
    .map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`))
    .join(CRLF);
}

export function buildCalendarFeed(events: CalendarEventRecord[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cub Scout Pack 60//Private Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pack 60 Private Calendar',
    'X-WR-TIMEZONE:America/New_York',
  ];

  for (const event of events) {
    const status =
      event.status === 'canceled'
        ? 'CANCELLED'
        : event.status === 'tentative'
          ? 'TENTATIVE'
          : 'CONFIRMED';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@pack60.org`,
      `DTSTAMP:${utcStamp(event.updated_at)}`,
      `LAST-MODIFIED:${utcStamp(event.updated_at)}`,
      `DTSTART:${utcStamp(event.starts_at)}`,
      `DTEND:${utcStamp(event.ends_at)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.location)}`,
      `STATUS:${status}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join(CRLF)}${CRLF}`;
}
