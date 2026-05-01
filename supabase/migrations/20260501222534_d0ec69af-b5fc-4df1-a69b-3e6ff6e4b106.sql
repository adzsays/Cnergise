-- Connections table
CREATE TABLE public.google_calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  google_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  primary_calendar_id TEXT DEFAULT 'primary',
  sync_token TEXT,
  last_sync_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own gcal connection" ON public.google_calendar_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gcal connection" ON public.google_calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own gcal connection" ON public.google_calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own gcal connection" ON public.google_calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_gcal_connections_updated_at
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Webhook channels
CREATE TABLE public.google_calendar_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  resource_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  expiration TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own gcal channels" ON public.google_calendar_channels
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gcal channels" ON public.google_calendar_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own gcal channels" ON public.google_calendar_channels
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_gcal_channels_user ON public.google_calendar_channels(user_id);
CREATE INDEX idx_gcal_channels_channel ON public.google_calendar_channels(channel_id);

-- Add sync metadata to calendar_events (create table if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users insert own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users delete own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS etag TEXT,
  ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_google
  ON public.calendar_events(user_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

DO $$ BEGIN
  CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;