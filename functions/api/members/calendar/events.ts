import { listCalendarEvents } from '../../../_lib/calendar';
import { json } from '../../../_lib/http';
import type { AppPagesFunction } from '../../../_lib/types';

export const onRequestGet: AppPagesFunction = async (context) => {
  return json({ events: await listCalendarEvents(context.env.DB) });
};
