CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  default_rate numeric NOT NULL DEFAULT 0,
  default_qty numeric NOT NULL DEFAULT 1,
  unit text,
  currency text NOT NULL DEFAULT 'GBP',
  cost_centre text,
  space_id uuid,
  project_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own services — select" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own services — insert" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own services — update" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own services — delete" ON public.services FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_services_user ON public.services(user_id);
CREATE INDEX idx_services_space ON public.services(space_id);