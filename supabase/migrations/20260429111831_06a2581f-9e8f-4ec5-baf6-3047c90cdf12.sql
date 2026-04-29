-- Multi-term rate schedule for loans/mortgages.
-- Each row defines one period (e.g. a 2-year fixed at 4.5%, then a 3-year fixed at 5.1%, then variable).
CREATE TABLE public.loan_rate_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  term_months INTEGER,                 -- NULL means runs indefinitely (e.g. final variable period)
  rate_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' | 'variable'
  interest_rate NUMERIC NOT NULL DEFAULT 0, -- annual % APR for this period
  payment_override NUMERIC,            -- optional fixed monthly payment for this period
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_rate_terms_account ON public.loan_rate_terms(account_id, sequence);

ALTER TABLE public.loan_rate_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loan rate terms"
  ON public.loan_rate_terms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loan rate terms"
  ON public.loan_rate_terms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loan rate terms"
  ON public.loan_rate_terms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loan rate terms"
  ON public.loan_rate_terms FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_loan_rate_terms_updated_at
  BEFORE UPDATE ON public.loan_rate_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();