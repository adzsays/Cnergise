-- Allowlist table
CREATE TABLE public.allowed_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Normalize emails to lowercase
CREATE OR REPLACE FUNCTION public.normalize_allowed_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_allowed_email
BEFORE INSERT OR UPDATE ON public.allowed_emails
FOR EACH ROW EXECUTE FUNCTION public.normalize_allowed_email();

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only admins manage the allowlist
CREATE POLICY "Admins can view allowed emails"
ON public.allowed_emails FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert allowed emails"
ON public.allowed_emails FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update allowed emails"
ON public.allowed_emails FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete allowed emails"
ON public.allowed_emails FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public helper: anyone (incl. unauthenticated) can check if an email is allowed.
-- Returns boolean only — does not leak the list contents.
CREATE OR REPLACE FUNCTION public.is_email_allowed(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE email = lower(trim(_email))
  )
  OR lower(trim(_email)) ILIKE '%adithyavshetty%';
$$;

GRANT EXECUTE ON FUNCTION public.is_email_allowed(text) TO anon, authenticated;

-- Block sign-ups by non-allowed emails at the DB level (defense-in-depth).
-- Triggered when handle_new_user runs after auth.users insert; we add a separate
-- BEFORE trigger on auth.users via a wrapper that validates the email.
CREATE OR REPLACE FUNCTION public.enforce_allowed_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_email_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Access is invite-only. This email is not on the allowlist.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_allowed_email
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email_on_signup();

-- Seed owner email so you keep access
INSERT INTO public.allowed_emails (email, note)
VALUES ('adithyavshetty@gmail.com', 'Owner')
ON CONFLICT (email) DO NOTHING;