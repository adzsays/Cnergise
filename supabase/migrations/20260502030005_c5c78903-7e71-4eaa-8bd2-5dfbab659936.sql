-- 1. Add handle column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles (handle);

-- Validate handle format on insert/update
CREATE OR REPLACE FUNCTION public.validate_handle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.handle IS NOT NULL THEN
    NEW.handle = lower(trim(NEW.handle));
    IF NEW.handle !~ '^[a-z0-9_]{3,24}$' THEN
      RAISE EXCEPTION 'Handle must be 3-24 characters, lowercase letters/numbers/underscore only';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_handle ON public.profiles;
CREATE TRIGGER validate_profile_handle
BEFORE INSERT OR UPDATE OF handle ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_handle();

-- 2. Direct messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_sender_recipient ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON public.direct_messages (recipient_id, created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view DMs they sent or received"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users send DMs as themselves"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users delete their own sent DMs"
ON public.direct_messages FOR DELETE
USING (auth.uid() = sender_id);

CREATE POLICY "Recipients mark messages read"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- 3. Safe handle-lookup function (invite-only discovery)
-- Returns minimal info so invite-only contacts can resolve a handle to a user
CREATE OR REPLACE FUNCTION public.find_user_by_handle(_handle TEXT)
RETURNS TABLE (id UUID, handle TEXT, name TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.handle, p.name, p.avatar_url
  FROM public.profiles p
  WHERE p.handle = lower(trim(_handle))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_user_by_handle(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user_by_handle(TEXT) TO authenticated;