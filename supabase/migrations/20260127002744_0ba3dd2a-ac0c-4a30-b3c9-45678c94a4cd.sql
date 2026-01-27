-- Add cost_centre and frequency columns to financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN cost_centre text,
ADD COLUMN frequency text DEFAULT 'one-time';