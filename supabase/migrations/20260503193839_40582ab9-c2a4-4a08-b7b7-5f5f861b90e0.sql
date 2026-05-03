
-- Notification preferences (per user channel toggles)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  web_push_enabled boolean NOT NULL DEFAULT true,
  native_push_enabled boolean NOT NULL DEFAULT true,
  default_lead_minutes integer NOT NULL DEFAULT 15,
  task_lead_minutes integer NOT NULL DEFAULT 1440,
  payment_lead_minutes integer NOT NULL DEFAULT 1440,
  event_lead_minutes integer NOT NULL DEFAULT 15,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tr_notif_prefs_updated BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reminders queue (per item)
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL, -- 'task' | 'event' | 'payment' | 'goal' | 'health'
  source_id uuid,
  source_table text,
  title text NOT NULL,
  description text,
  remind_at timestamptz NOT NULL,
  lead_minutes integer DEFAULT 0,
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  external_url text,
  sent_at timestamptz,
  delivery_status jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders" ON public.reminders
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders (remind_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.reminders (user_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_source ON public.reminders (source_type, source_id);

-- Web push subscriptions
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own webpush" ON public.web_push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Native device push tokens (FCM/APNs)
CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL, -- 'ios' | 'android' | 'web'
  token text NOT NULL UNIQUE,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own device tokens" ON public.device_push_tokens
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable scheduling extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
