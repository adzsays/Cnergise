
-- Terra connections (one per user, holds the Terra user_id once linked)
CREATE TABLE public.terra_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  terra_user_id text,
  provider text,
  scopes text,
  status text NOT NULL DEFAULT 'pending',
  last_webhook_at timestamptz,
  last_sync_at timestamptz,
  reference_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_terra_connections_user ON public.terra_connections(user_id);
CREATE INDEX idx_terra_connections_terra_user ON public.terra_connections(terra_user_id);

ALTER TABLE public.terra_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own terra connections" ON public.terra_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own terra connections" ON public.terra_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own terra connections" ON public.terra_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own terra connections" ON public.terra_connections
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_terra_connections_updated
  BEFORE UPDATE ON public.terra_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Health metrics (daily summaries from Terra or other sources)
CREATE TABLE public.health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'terra',
  provider text,
  metric_date date NOT NULL,
  steps integer,
  distance_meters numeric,
  calories_burned numeric,
  active_minutes integer,
  resting_heart_rate integer,
  avg_heart_rate integer,
  max_heart_rate integer,
  sleep_minutes integer,
  sleep_quality numeric,
  water_ml numeric,
  weight_kg numeric,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, provider, metric_date)
);
CREATE INDEX idx_health_metrics_user_date ON public.health_metrics(user_id, metric_date DESC);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own health metrics" ON public.health_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own health metrics" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own health metrics" ON public.health_metrics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own health metrics" ON public.health_metrics
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_health_metrics_updated
  BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
