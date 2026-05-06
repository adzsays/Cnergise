
-- 1. Mapping fields on actual_expenses (bank transactions)
ALTER TABLE public.actual_expenses
  ADD COLUMN IF NOT EXISTS mapped_cashflow_id uuid NULL REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mapping_source text NULL,
  ADD COLUMN IF NOT EXISTS mapping_confidence numeric NULL,
  ADD COLUMN IF NOT EXISTS cost_centre text NULL;

CREATE INDEX IF NOT EXISTS idx_actual_exp_mapped_cashflow
  ON public.actual_expenses(user_id, mapped_cashflow_id);

-- 2. Default cost centre on accounts (column already exists per types - safe-add)
ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS cost_centre text NULL;

-- 3. Rules table
CREATE TABLE IF NOT EXISTS public.cashflow_mapping_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  match_type text NOT NULL DEFAULT 'description_contains',
  match_value text NOT NULL,
  account_id uuid NULL REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  min_amount numeric NULL,
  max_amount numeric NULL,
  cashflow_id uuid NULL REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  cost_centre text NULL,
  priority integer NOT NULL DEFAULT 100,
  times_applied integer NOT NULL DEFAULT 0,
  last_applied_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cf_rules_user_match
  ON public.cashflow_mapping_rules(user_id, match_type, match_value);
CREATE INDEX IF NOT EXISTS idx_cf_rules_user_priority
  ON public.cashflow_mapping_rules(user_id, priority DESC);

ALTER TABLE public.cashflow_mapping_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mapping rules" ON public.cashflow_mapping_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mapping rules" ON public.cashflow_mapping_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mapping rules" ON public.cashflow_mapping_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mapping rules" ON public.cashflow_mapping_rules
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cf_rules_updated_at
  BEFORE UPDATE ON public.cashflow_mapping_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Helper: normalize description for matching (lowercase, strip digits/punctuation noise)
CREATE OR REPLACE FUNCTION public.normalize_txn_text(_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(trim(regexp_replace(coalesce(_text, ''), '[^a-zA-Z ]+', ' ', 'g')))
$$;
