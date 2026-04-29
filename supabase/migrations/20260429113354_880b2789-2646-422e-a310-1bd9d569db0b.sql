ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_rate_terms;
ALTER TABLE public.loan_rate_terms REPLICA IDENTITY FULL;