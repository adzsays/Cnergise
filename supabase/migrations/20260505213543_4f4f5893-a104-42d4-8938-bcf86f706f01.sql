
ALTER TABLE public.risk_profiles
  ADD COLUMN IF NOT EXISTS risk_band TEXT,
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
  ADD COLUMN IF NOT EXISTS assessed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assessment_inputs JSONB;

CREATE TABLE IF NOT EXISTS public.strategy_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_risk_band TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own bundles" ON public.strategy_bundles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_strategy_bundles_updated BEFORE UPDATE ON public.strategy_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.strategy_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bundle_id UUID NOT NULL REFERENCES public.strategy_bundles(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.trading_strategies(id) ON DELETE CASCADE,
  weight_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own bundle items" ON public.strategy_bundle_items
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON public.strategy_bundle_items(bundle_id);

CREATE TABLE IF NOT EXISTS public.strategy_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  strategy_id UUID REFERENCES public.trading_strategies(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.strategy_bundles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_pct NUMERIC,
  cumulative_return_pct NUMERIC,
  benchmark_return_pct NUMERIC,
  sharpe_ratio NUMERIC,
  max_drawdown_pct NUMERIC,
  win_rate_pct NUMERIC,
  trades_count INTEGER,
  notes TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_performance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own snapshots" ON public.strategy_performance_snapshots
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_strategy ON public.strategy_performance_snapshots(user_id, strategy_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_bundle ON public.strategy_performance_snapshots(user_id, bundle_id, snapshot_date DESC);
