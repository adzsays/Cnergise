ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS recurrence text;

ALTER TABLE public.google_calendar_connections
  ADD COLUMN IF NOT EXISTS reauth_required boolean NOT NULL DEFAULT false;