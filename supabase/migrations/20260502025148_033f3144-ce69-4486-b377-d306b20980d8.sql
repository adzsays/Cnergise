CREATE TABLE public.credit_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 1000,
  rating TEXT,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credit scores"
ON public.credit_scores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credit scores"
ON public.credit_scores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own credit scores"
ON public.credit_scores FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own credit scores"
ON public.credit_scores FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_credit_scores_updated_at
BEFORE UPDATE ON public.credit_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();