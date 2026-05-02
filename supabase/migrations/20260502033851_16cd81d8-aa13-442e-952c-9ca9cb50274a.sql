ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS completion_percent integer NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100);