ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS reference_code text;
CREATE UNIQUE INDEX IF NOT EXISTS customers_user_reference_uidx ON public.customers(user_id, reference_code) WHERE reference_code IS NOT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS next_invoice_seq integer NOT NULL DEFAULT 1;