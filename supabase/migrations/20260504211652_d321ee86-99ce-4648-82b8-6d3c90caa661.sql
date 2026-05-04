-- Pricing catalog (admin-managed)
CREATE TABLE public.service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  operation text NOT NULL DEFAULT 'default',
  unit text NOT NULL DEFAULT 'call',
  unit_cost numeric(18,8) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service, operation)
);

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view pricing" ON public.service_pricing FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert pricing" ON public.service_pricing FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update pricing" ON public.service_pricing FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete pricing" ON public.service_pricing FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Usage events (instrumented by edge functions)
CREATE TABLE public.service_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  operation text NOT NULL DEFAULT 'default',
  units numeric(18,6) NOT NULL DEFAULT 1,
  unit_cost numeric(18,8) NOT NULL DEFAULT 0,
  total_cost numeric(18,8) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  function_name text,
  user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_service_created ON public.service_usage_events (service, created_at DESC);
CREATE INDEX idx_usage_events_created ON public.service_usage_events (created_at DESC);
CREATE INDEX idx_usage_events_function ON public.service_usage_events (function_name, created_at DESC);

ALTER TABLE public.service_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view usage events" ON public.service_usage_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role inserts usage events" ON public.service_usage_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Seed starter pricing (GBP, indicative)
INSERT INTO public.service_pricing (service, operation, unit, unit_cost, currency, notes) VALUES
  ('lovable-ai', 'google/gemini-2.5-flash', '1k_tokens', 0.000060, 'GBP', 'Indicative — adjust to actual'),
  ('lovable-ai', 'google/gemini-2.5-pro', '1k_tokens', 0.000800, 'GBP', 'Indicative — adjust to actual'),
  ('lovable-ai', 'google/gemini-2.5-flash-lite', '1k_tokens', 0.000020, 'GBP', 'Indicative'),
  ('lovable-ai', 'openai/gpt-5-mini', '1k_tokens', 0.000400, 'GBP', 'Indicative'),
  ('perplexity', 'sonar', 'call', 0.005000, 'GBP', 'Per request'),
  ('edge-function', 'invocation', 'call', 0.000002, 'GBP', 'Compute time'),
  ('supabase-storage', 'gb_month', 'gb', 0.020000, 'GBP', 'Storage');