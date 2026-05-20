
-- 1. Server-side enforcement of invite-only signup
DROP TRIGGER IF EXISTS enforce_allowed_email_before_signup ON auth.users;
CREATE TRIGGER enforce_allowed_email_before_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email_on_signup();

-- 2. Encryption triggers for broker credential tables
CREATE OR REPLACE FUNCTION public._encrypt_alpaca_secrets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  NEW.api_secret := public.encrypt_credential(NEW.api_secret);
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS trg_alpaca_encrypt ON public.alpaca_connections;
CREATE TRIGGER trg_alpaca_encrypt
  BEFORE INSERT OR UPDATE ON public.alpaca_connections
  FOR EACH ROW EXECUTE FUNCTION public._encrypt_alpaca_secrets();

CREATE OR REPLACE FUNCTION public._encrypt_ibkr_secrets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  NEW.api_token     := public.encrypt_credential(NEW.api_token);
  NEW.access_token  := public.encrypt_credential(NEW.access_token);
  NEW.refresh_token := public.encrypt_credential(NEW.refresh_token);
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS trg_ibkr_encrypt ON public.ibkr_connections;
CREATE TRIGGER trg_ibkr_encrypt
  BEFORE INSERT OR UPDATE ON public.ibkr_connections
  FOR EACH ROW EXECUTE FUNCTION public._encrypt_ibkr_secrets();

-- 3. Backfill existing plaintext rows (idempotent — encrypt_credential is a no-op on enc:v1: prefix)
UPDATE public.alpaca_connections
   SET api_secret = public.encrypt_credential(api_secret)
 WHERE api_secret IS NOT NULL AND api_secret NOT LIKE 'enc:v1:%';

UPDATE public.ibkr_connections
   SET api_token = public.encrypt_credential(api_token),
       access_token = public.encrypt_credential(access_token),
       refresh_token = public.encrypt_credential(refresh_token)
 WHERE (api_token IS NOT NULL AND api_token NOT LIKE 'enc:v1:%')
    OR (access_token IS NOT NULL AND access_token NOT LIKE 'enc:v1:%')
    OR (refresh_token IS NOT NULL AND refresh_token NOT LIKE 'enc:v1:%');

-- 4. Security-invoker decrypted views (only the row owner can read via RLS)
CREATE OR REPLACE VIEW public.alpaca_connections_decrypted
WITH (security_invoker = true) AS
SELECT id, user_id, nickname, api_key_id,
       public.decrypt_credential(api_secret) AS api_secret,
       environment, base_url, demo_mode, status,
       last_synced_at, last_error, created_at, updated_at
FROM public.alpaca_connections;

CREATE OR REPLACE VIEW public.ibkr_connections_decrypted
WITH (security_invoker = true) AS
SELECT id, user_id, account_id,
       public.decrypt_credential(access_token)  AS access_token,
       public.decrypt_credential(refresh_token) AS refresh_token,
       public.decrypt_credential(api_token)     AS api_token,
       token_type, expires_at, environment, status,
       last_synced_at, last_error, created_at, updated_at,
       gateway_url, nickname, demo_mode
FROM public.ibkr_connections;

-- 5. Revoke EXECUTE on internal SECURITY DEFINER helpers from public/anon
REVOKE EXECUTE ON FUNCTION public._app_credential_key() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_credential(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_credential(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_cron_secret() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_allowed_email_on_signup() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_invite_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_default_space_for_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_admin_to_specific_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._encrypt_gcal_tokens() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._encrypt_user_integration_secrets() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._encrypt_alpaca_secrets() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._encrypt_ibkr_secrets() FROM PUBLIC, anon;
