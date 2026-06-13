
-- 1. Add account_id linking each event to its source Google connection
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.google_calendar_connections(id) ON DELETE CASCADE;

-- 2. Backfill existing rows where possible (single-account users only — multi-account collisions cannot be retroactively split)
UPDATE public.calendar_events ce
SET account_id = sub.account_id
FROM (
  SELECT DISTINCT user_id, account_id
  FROM public.google_calendar_subscriptions
  WHERE enabled = true
) sub
WHERE ce.account_id IS NULL
  AND ce.user_id = sub.user_id
  AND ce.sync_source = 'google'
  AND (SELECT COUNT(*) FROM public.google_calendar_connections gcc WHERE gcc.user_id = ce.user_id) = 1;

-- 3. Drop old unique index, replace with one that includes account_id
DROP INDEX IF EXISTS public.idx_calendar_events_google;
CREATE UNIQUE INDEX idx_calendar_events_google_per_account
  ON public.calendar_events (user_id, account_id, google_calendar_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

-- 4. Reset all sync tokens to force a full re-pull (will repopulate everything cleanly with account_id)
UPDATE public.google_calendar_subscriptions SET sync_token = NULL;

-- 5. Enable realtime so UI updates the moment sync writes new data
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;
