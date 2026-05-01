-- Track which Google calendars the user has subscribed to (multi-calendar support)
CREATE TABLE IF NOT EXISTS public.google_calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  google_calendar_id TEXT NOT NULL,
  summary TEXT,
  background_color TEXT,
  foreground_color TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sync_token TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, google_calendar_id)
);

ALTER TABLE public.google_calendar_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own gcal subs" ON public.google_calendar_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gcal subs" ON public.google_calendar_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own gcal subs" ON public.google_calendar_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own gcal subs" ON public.google_calendar_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_gcal_subs_updated
  BEFORE UPDATE ON public.google_calendar_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure calendar_events has all_day column (referenced in sync)
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS all_day BOOLEAN NOT NULL DEFAULT false;

-- Unique constraint for upsert in sync
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_user_google_event_uniq
  ON public.calendar_events (user_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start
  ON public.calendar_events (user_id, start_time);