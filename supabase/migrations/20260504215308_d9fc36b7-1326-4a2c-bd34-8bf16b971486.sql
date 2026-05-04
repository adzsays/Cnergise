
-- IBKR connection per user
CREATE TABLE public.ibkr_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id text,
  access_token text,
  refresh_token text,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz,
  environment text NOT NULL DEFAULT 'paper', -- paper | live
  status text NOT NULL DEFAULT 'disconnected', -- disconnected | connected | error
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE public.ibkr_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own ibkr connection" ON public.ibkr_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ibkr_connections_updated BEFORE UPDATE ON public.ibkr_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Live positions synced from broker
CREATE TABLE public.broker_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  broker text NOT NULL DEFAULT 'ibkr',
  account_id text,
  symbol text NOT NULL,
  asset_class text, -- STK, OPT, FUT, CASH, CRYPTO, BOND
  quantity numeric NOT NULL DEFAULT 0,
  avg_cost numeric,
  market_price numeric,
  market_value numeric,
  unrealized_pnl numeric,
  realized_pnl numeric,
  currency text DEFAULT 'USD',
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, broker, account_id, symbol)
);
ALTER TABLE public.broker_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own positions" ON public.broker_positions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service can write positions" ON public.broker_positions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_broker_positions_user ON public.broker_positions(user_id, synced_at DESC);
CREATE TRIGGER trg_broker_positions_updated BEFORE UPDATE ON public.broker_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders placed via app
CREATE TABLE public.broker_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  broker text NOT NULL DEFAULT 'ibkr',
  account_id text,
  broker_order_id text,
  symbol text NOT NULL,
  asset_class text DEFAULT 'STK',
  side text NOT NULL, -- BUY | SELL
  order_type text NOT NULL DEFAULT 'MKT', -- MKT | LMT | STP | STP_LMT
  quantity numeric NOT NULL,
  limit_price numeric,
  stop_price numeric,
  tif text DEFAULT 'DAY',
  status text NOT NULL DEFAULT 'pending', -- pending | submitted | filled | cancelled | rejected
  filled_quantity numeric DEFAULT 0,
  avg_fill_price numeric,
  strategy_id uuid,
  signal_id uuid,
  rationale text,
  raw jsonb,
  submitted_at timestamptz,
  filled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broker_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own orders" ON public.broker_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_broker_orders_user ON public.broker_orders(user_id, created_at DESC);
CREATE TRIGGER trg_broker_orders_updated BEFORE UPDATE ON public.broker_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trading strategies
CREATE TABLE public.trading_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  strategy_type text NOT NULL DEFAULT 'ai_signal', -- ai_signal | rules | dca | rebalance
  asset_universe text[] DEFAULT ARRAY[]::text[], -- e.g. ['AAPL','MSFT']
  ai_prompt text,
  schedule text DEFAULT 'manual', -- manual | daily | weekly
  max_position_pct numeric DEFAULT 5, -- per trade % of portfolio
  stop_loss_pct numeric DEFAULT 5,
  take_profit_pct numeric DEFAULT 10,
  auto_execute boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft', -- draft | active | paused
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own strategies" ON public.trading_strategies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_trading_strategies_updated BEFORE UPDATE ON public.trading_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Risk profile
CREATE TABLE public.risk_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  max_position_pct numeric NOT NULL DEFAULT 5,
  max_sector_pct numeric NOT NULL DEFAULT 25,
  max_daily_loss_pct numeric NOT NULL DEFAULT 2,
  max_drawdown_pct numeric NOT NULL DEFAULT 15,
  default_stop_loss_pct numeric NOT NULL DEFAULT 5,
  default_take_profit_pct numeric NOT NULL DEFAULT 10,
  max_leverage numeric NOT NULL DEFAULT 1,
  allow_short boolean NOT NULL DEFAULT false,
  allow_options boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own risk profile" ON public.risk_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_risk_profiles_updated BEFORE UPDATE ON public.risk_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI trade signals
CREATE TABLE public.ai_trade_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy_id uuid REFERENCES public.trading_strategies(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  asset_class text DEFAULT 'STK',
  side text NOT NULL, -- BUY | SELL | HOLD
  conviction numeric, -- 0-100
  suggested_quantity numeric,
  suggested_limit_price numeric,
  suggested_stop_loss numeric,
  suggested_take_profit numeric,
  rationale text,
  risk_assessment jsonb,
  status text NOT NULL DEFAULT 'new', -- new | approved | rejected | executed | expired
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_trade_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own signals" ON public.ai_trade_signals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ai_trade_signals_user ON public.ai_trade_signals(user_id, generated_at DESC);
CREATE TRIGGER trg_ai_trade_signals_updated BEFORE UPDATE ON public.ai_trade_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
