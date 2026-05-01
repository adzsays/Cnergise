
-- Drop the implicit unique-on-user_id constraint (created by upsert with onConflict: "user_id")
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.google_calendar_connections'::regclass
      AND contype IN ('u','p')
      AND pg_get_constraintdef(oid) ILIKE '%(user_id)%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%google_email%'
  LOOP
    EXECUTE format('ALTER TABLE public.google_calendar_connections DROP CONSTRAINT %I', cname);
  END LOOP;
END$$;

-- Drop any unique indexes on (user_id) alone
DO $$
DECLARE
  iname text;
BEGIN
  FOR iname IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public' AND tablename='google_calendar_connections'
      AND indexdef ILIKE '%UNIQUE%(user_id)%' AND indexdef NOT ILIKE '%google_email%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', iname);
  END LOOP;
END$$;

-- Ensure unique (user_id, google_email)
CREATE UNIQUE INDEX IF NOT EXISTS google_calendar_connections_user_email_key
  ON public.google_calendar_connections(user_id, google_email);

-- Add account_id to subscriptions
ALTER TABLE public.google_calendar_subscriptions
  ADD COLUMN IF NOT EXISTS account_id uuid;

-- Backfill: for existing rows, link to the user's single existing connection if any
UPDATE public.google_calendar_subscriptions s
SET account_id = c.id
FROM public.google_calendar_connections c
WHERE s.account_id IS NULL AND s.user_id = c.user_id;

-- New unique index per account+calendar (replaces user+calendar uniqueness)
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.google_calendar_subscriptions'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(user_id, google_calendar_id)%'
  LOOP
    EXECUTE format('ALTER TABLE public.google_calendar_subscriptions DROP CONSTRAINT %I', cname);
  END LOOP;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS gcal_subs_account_calendar_key
  ON public.google_calendar_subscriptions(account_id, google_calendar_id)
  WHERE account_id IS NOT NULL;

-- Add account_id to channels too (for per-account watch)
ALTER TABLE public.google_calendar_channels
  ADD COLUMN IF NOT EXISTS account_id uuid;

UPDATE public.google_calendar_channels ch
SET account_id = c.id
FROM public.google_calendar_connections c
WHERE ch.account_id IS NULL AND ch.user_id = c.user_id;
