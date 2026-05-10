-- Ensure extensions for cron & HTTP
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Ensure cron secret exists in vault (idempotent)
DO $$
DECLARE
  has_secret boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM vault.secrets WHERE name = 'cnergise_cron_secret') INTO has_secret;
  IF NOT has_secret THEN
    PERFORM vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'cnergise_cron_secret', 'Shared secret for cron-triggered edge functions');
  END IF;
END $$;

-- Unschedule any prior version then (re)schedule every 5 minutes
DO $$
BEGIN
  PERFORM cron.unschedule('google-calendar-cron-every-5min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'google-calendar-cron-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://dhpaigtpzzagytbtmckh.supabase.co/functions/v1/google-calendar-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cnergise_cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cron$
);