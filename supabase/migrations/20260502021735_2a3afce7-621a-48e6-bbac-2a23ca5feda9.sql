-- Invite request system: public can submit, only admins can review
CREATE TABLE public.invite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- normalize email on insert/update
CREATE OR REPLACE FUNCTION public.normalize_invite_email()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invite_requests_normalize
BEFORE INSERT OR UPDATE ON public.invite_requests
FOR EACH ROW EXECUTE FUNCTION public.normalize_invite_email();

CREATE TRIGGER trg_invite_requests_updated_at
BEFORE UPDATE ON public.invite_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prevent duplicate pending requests for the same email
CREATE UNIQUE INDEX idx_invite_requests_unique_pending
  ON public.invite_requests(email) WHERE status = 'pending';

ALTER TABLE public.invite_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a request
CREATE POLICY "Anyone can submit invite requests"
ON public.invite_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view/update/delete
CREATE POLICY "Admins can view all invite requests"
ON public.invite_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invite requests"
ON public.invite_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invite requests"
ON public.invite_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- When admin approves, automatically add the email to allowed_emails so signup is permitted
CREATE OR REPLACE FUNCTION public.handle_invite_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.allowed_emails (email)
    VALUES (lower(trim(NEW.email)))
    ON CONFLICT (email) DO NOTHING;
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
    NEW.reviewed_by = COALESCE(NEW.reviewed_by, auth.uid());
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
    NEW.reviewed_by = COALESCE(NEW.reviewed_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invite_requests_on_approval
BEFORE UPDATE ON public.invite_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_invite_approval();

-- Make sure the existing signup-allowlist trigger is actually attached to auth.users
-- (the schema lists no triggers; the function exists but may not be wired up).
-- We do NOT create triggers on auth.* schemas as a rule, but the existing
-- function `enforce_allowed_email_on_signup` is designed to run on auth.users.
-- The project already declares this enforcement; we only ensure the trigger exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_allowed_email_on_signup_trg'
  ) THEN
    CREATE TRIGGER enforce_allowed_email_on_signup_trg
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email_on_signup();
  END IF;
END $$;