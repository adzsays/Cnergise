CREATE TABLE public.actual_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  space_id uuid NULL,
  posted_on date NOT NULL,
  merchant text NULL,
  description text NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  category text NULL,
  sub_type text NULL,
  notes text NULL,
  account_provider text NULL,
  account_name text NULL,
  status text NULL,
  source text NOT NULL DEFAULT 'excel',
  external_id text NULL,
  raw jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_actual_expenses_user_date ON public.actual_expenses(user_id, posted_on DESC);
CREATE UNIQUE INDEX idx_actual_expenses_dedupe ON public.actual_expenses(user_id, source, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.actual_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own actual expenses" ON public.actual_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own actual expenses" ON public.actual_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own actual expenses" ON public.actual_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own actual expenses" ON public.actual_expenses FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_actual_expenses_updated_at
BEFORE UPDATE ON public.actual_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();