-- Add cash flow section classification to financial_transactions
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS cash_flow_section text NOT NULL DEFAULT 'operating';

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_cash_flow_section_check;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_cash_flow_section_check
  CHECK (cash_flow_section IN ('operating','investing','financing'));

-- Backfill: investing for items linked to investment/pension accounts
UPDATE public.financial_transactions t
SET cash_flow_section = 'investing'
FROM public.financial_accounts a
WHERE a.name = t.category
  AND a.user_id = t.user_id
  AND (
    lower(coalesce(a.category,'')) ~ '(invest|pension|crypto|broker)'
  )
  AND t.cash_flow_section = 'operating';

-- Backfill: financing for items linked to liability accounts (loan/cc payments)
UPDATE public.financial_transactions t
SET cash_flow_section = 'financing'
FROM public.financial_accounts a
WHERE a.name = t.category
  AND a.user_id = t.user_id
  AND (
    lower(coalesce(a.account_class,'')) = 'liability'
    OR lower(coalesce(a.type,'')) = 'liability'
  )
  AND t.cash_flow_section = 'operating';

CREATE INDEX IF NOT EXISTS idx_financial_transactions_cf_section
  ON public.financial_transactions (user_id, cash_flow_section);