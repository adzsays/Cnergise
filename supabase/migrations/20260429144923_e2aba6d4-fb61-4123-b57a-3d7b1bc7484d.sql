ALTER TABLE public.financial_accounts
ADD COLUMN IF NOT EXISTS payment_day integer;

COMMENT ON COLUMN public.financial_accounts.payment_day IS 'Day of month (1-31) the loan/mortgage payment is taken. Drives cash flow timing.';