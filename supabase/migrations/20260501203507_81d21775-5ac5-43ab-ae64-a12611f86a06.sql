
-- Echo: Daily voice journal feature
CREATE TABLE public.echo_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  unit TEXT,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  raw_voice_text TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME WITHOUT TIME ZONE DEFAULT LOCALTIME,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.echo_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own echo entries" ON public.echo_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own echo entries" ON public.echo_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own echo entries" ON public.echo_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own echo entries" ON public.echo_entries
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_echo_entries_user_date ON public.echo_entries(user_id, entry_date DESC);
CREATE INDEX idx_echo_entries_space ON public.echo_entries(space_id);

CREATE TRIGGER update_echo_entries_updated_at
  BEFORE UPDATE ON public.echo_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Register Echo as an app feature
INSERT INTO public.app_features (key, name, description, category, route, icon, is_core, requires_approval, sort_order, is_available)
VALUES (
  'echo',
  'Echo Voice Journal',
  'Capture your day with voice notes — AI auto-categorises spending, food, exercise, events and links them to your goals.',
  'standard',
  '/echo',
  'Mic',
  false,
  false,
  95,
  true
)
ON CONFLICT (key) DO NOTHING;
