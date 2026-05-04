
CREATE TABLE public.visitor_chat_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_chat_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chat knowledge" ON public.visitor_chat_knowledge
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER vck_updated_at BEFORE UPDATE ON public.visitor_chat_knowledge
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow public (anon) to read the visitor_chat_enabled system setting only
CREATE POLICY "Public can read visitor_chat_enabled" ON public.system_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'visitor_chat_enabled');

-- Seed the flag disabled by default for beta
INSERT INTO public.system_settings (key, value)
VALUES ('visitor_chat_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
