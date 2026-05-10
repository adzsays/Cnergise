DO $$
BEGIN
  PERFORM cron.unschedule('google-calendar-cron-every-5min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('google-calendar-cron-every-1min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'google-calendar-cron-every-1min',
  '* * * * *',
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