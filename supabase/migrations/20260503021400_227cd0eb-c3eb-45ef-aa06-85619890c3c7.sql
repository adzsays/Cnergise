DROP INDEX IF EXISTS public.idx_actual_expenses_dedupe;
ALTER TABLE public.actual_expenses
  ALTER COLUMN external_id SET DEFAULT '',
  ALTER COLUMN external_id SET NOT NULL;
UPDATE public.actual_expenses SET external_id = id::text WHERE external_id = '' OR external_id IS NULL;
ALTER TABLE public.actual_expenses
  ADD CONSTRAINT actual_expenses_dedupe_uniq UNIQUE (user_id, source, external_id);