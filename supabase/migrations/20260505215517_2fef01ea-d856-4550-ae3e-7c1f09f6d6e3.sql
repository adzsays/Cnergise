
CREATE TABLE IF NOT EXISTS public.listening_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  trigger_mentions boolean NOT NULL DEFAULT true,
  trigger_vip boolean NOT NULL DEFAULT true,
  trigger_action_required boolean NOT NULL DEFAULT true,
  trigger_keywords boolean NOT NULL DEFAULT true,
  vip_handles text[] NOT NULL DEFAULT '{}',
  source_email boolean NOT NULL DEFAULT true,
  source_messaging boolean NOT NULL DEFAULT true,
  source_social boolean NOT NULL DEFAULT true,
  prompt_floating boolean NOT NULL DEFAULT true,
  prompt_push boolean NOT NULL DEFAULT true,
  prompt_digest boolean NOT NULL DEFAULT true,
  digest_hour integer NOT NULL DEFAULT 8 CHECK (digest_hour BETWEEN 0 AND 23),
  min_score integer NOT NULL DEFAULT 75,
  last_scan_at timestamptz,
  last_digest_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listening_agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own listening settings" ON public.listening_agent_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own listening settings" ON public.listening_agent_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own listening settings" ON public.listening_agent_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own listening settings" ON public.listening_agent_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_listening_agent_settings_updated
  BEFORE UPDATE ON public.listening_agent_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.impact_messages
  ADD COLUMN IF NOT EXISTS suggested_reply text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_impact_messages_needs_prompt
  ON public.impact_messages (user_id, score DESC, message_at DESC)
  WHERE notified_at IS NULL AND is_archived = false;
