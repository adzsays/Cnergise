-- Allow the same google_event_id to appear across different calendars
-- (e.g. invitee meetings showing up in two of your synced accounts)
DROP INDEX IF EXISTS public.idx_calendar_events_google;
DROP INDEX IF EXISTS public.calendar_events_user_google_event_uniq;

CREATE UNIQUE INDEX idx_calendar_events_google
  ON public.calendar_events (user_id, google_calendar_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

-- Clean up duplicate primary subscriptions: when a connection has BOTH a
-- "primary" alias row AND an <email-id> row for the same calendar, keep the
-- email-id row (matches what Google returns from /events) and drop "primary".
DELETE FROM public.google_calendar_subscriptions s
WHERE s.google_calendar_id = 'primary'
  AND EXISTS (
    SELECT 1 FROM public.google_calendar_subscriptions s2
    WHERE s2.user_id = s.user_id
      AND s2.account_id = s.account_id
      AND s2.google_calendar_id <> 'primary'
      AND s2.is_primary = true
  );
