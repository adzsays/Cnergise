-- Per-user filter preferences for the AI Impact Inbox
CREATE TABLE public.impact_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  handles TEXT[] NOT NULL DEFAULT '{}',
  people TEXT[] NOT NULL DEFAULT '{}',
  brands TEXT[] NOT NULL DEFAULT '{}',
  sources JSONB NOT NULL DEFAULT '{"whatsapp":true,"telegram":true,"email":true,"twitter":true,"linkedin":true,"instagram":true,"facebook":true}'::jsonb,
  min_score INT NOT NULL DEFAULT 60,
  action_required_only BOOLEAN NOT NULL DEFAULT false,
  realtime_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.impact_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own filters" ON public.impact_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own filters" ON public.impact_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own filters" ON public.impact_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own filters" ON public.impact_filters FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_impact_filters_updated
  BEFORE UPDATE ON public.impact_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cache of AI-scored impactful messages across all sources
CREATE TABLE public.impact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT,
  author TEXT,
  author_handle TEXT,
  preview TEXT NOT NULL,
  full_content TEXT,
  url TEXT,
  score INT NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'later',
  action_required BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  matched_filters TEXT[] NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT impact_urgency_check CHECK (urgency IN ('now','today','later'))
);

CREATE INDEX idx_impact_messages_user_urgency ON public.impact_messages(user_id, urgency, message_at DESC);
CREATE INDEX idx_impact_messages_user_unread ON public.impact_messages(user_id, is_read) WHERE NOT is_archived;
CREATE UNIQUE INDEX idx_impact_messages_dedupe ON public.impact_messages(user_id, source, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.impact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own impact" ON public.impact_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own impact" ON public.impact_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own impact" ON public.impact_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own impact" ON public.impact_messages FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_messages;
ALTER TABLE public.impact_messages REPLICA IDENTITY FULL;