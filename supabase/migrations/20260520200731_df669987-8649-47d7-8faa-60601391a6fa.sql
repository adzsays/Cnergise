create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'app_credential_key';
  if v_id is null then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'app_credential_key',
      'Master key for column-level credential encryption'
    );
  end if;
end$$;

create or replace function public._app_credential_key()
returns text language sql stable security definer
set search_path = public, vault, pg_temp
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'app_credential_key' limit 1;
$$;
revoke all on function public._app_credential_key() from public, anon, authenticated;

create or replace function public.encrypt_credential(plaintext text)
returns text language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare k text;
begin
  if plaintext is null then return null; end if;
  if plaintext like 'enc:v1:%' then return plaintext; end if;
  k := public._app_credential_key();
  if k is null then raise exception 'Credential encryption key is not configured'; end if;
  return 'enc:v1:' || encode(extensions.pgp_sym_encrypt(plaintext, k), 'base64');
end$$;
revoke all on function public.encrypt_credential(text) from public, anon, authenticated;

create or replace function public.decrypt_credential(ciphertext text)
returns text language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare k text;
begin
  if ciphertext is null then return null; end if;
  if ciphertext not like 'enc:v1:%' then return ciphertext; end if;
  k := public._app_credential_key();
  if k is null then raise exception 'Credential encryption key is not configured'; end if;
  return extensions.pgp_sym_decrypt(decode(substring(ciphertext from 8), 'base64'), k);
exception when others then return null;
end$$;
revoke all on function public.decrypt_credential(text) from public, anon;
grant execute on function public.decrypt_credential(text) to authenticated, service_role;

create or replace function public._encrypt_gcal_tokens()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  new.access_token  := public.encrypt_credential(new.access_token);
  new.refresh_token := public.encrypt_credential(new.refresh_token);
  return new;
end$$;
drop trigger if exists trg_encrypt_gcal_tokens on public.google_calendar_connections;
create trigger trg_encrypt_gcal_tokens
  before insert or update on public.google_calendar_connections
  for each row execute function public._encrypt_gcal_tokens();

create or replace function public._encrypt_user_integration_secrets()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  new.email_smtp_password    := public.encrypt_credential(new.email_smtp_password);
  new.email_oauth_token      := public.encrypt_credential(new.email_oauth_token);
  new.calendar_oauth_token   := public.encrypt_credential(new.calendar_oauth_token);
  new.calendar_refresh_token := public.encrypt_credential(new.calendar_refresh_token);
  new.whatsapp_access_token  := public.encrypt_credential(new.whatsapp_access_token);
  new.telegram_bot_token     := public.encrypt_credential(new.telegram_bot_token);
  new.broker_api_key         := public.encrypt_credential(new.broker_api_key);
  new.broker_api_secret      := public.encrypt_credential(new.broker_api_secret);
  new.coursera_oauth_token   := public.encrypt_credential(new.coursera_oauth_token);
  new.coursera_refresh_token := public.encrypt_credential(new.coursera_refresh_token);
  return new;
end$$;
drop trigger if exists trg_encrypt_user_integration_secrets on public.user_integrations;
create trigger trg_encrypt_user_integration_secrets
  before insert or update on public.user_integrations
  for each row execute function public._encrypt_user_integration_secrets();

update public.google_calendar_connections
  set access_token = access_token, refresh_token = refresh_token
  where (access_token is not null and access_token not like 'enc:v1:%')
     or (refresh_token is not null and refresh_token not like 'enc:v1:%');

update public.user_integrations
  set email_smtp_password    = email_smtp_password,
      email_oauth_token      = email_oauth_token,
      calendar_oauth_token   = calendar_oauth_token,
      calendar_refresh_token = calendar_refresh_token,
      whatsapp_access_token  = whatsapp_access_token,
      telegram_bot_token     = telegram_bot_token,
      broker_api_key         = broker_api_key,
      broker_api_secret      = broker_api_secret,
      coursera_oauth_token   = coursera_oauth_token,
      coursera_refresh_token = coursera_refresh_token;

create or replace view public.google_calendar_connections_decrypted
with (security_invoker = on) as
select id, user_id, google_email,
  public.decrypt_credential(access_token)  as access_token,
  public.decrypt_credential(refresh_token) as refresh_token,
  token_expires_at, primary_calendar_id, sync_token, last_sync_at, scope,
  created_at, updated_at, last_sync_error
from public.google_calendar_connections;
revoke all on public.google_calendar_connections_decrypted from public, anon;
grant select on public.google_calendar_connections_decrypted to authenticated, service_role;

create or replace view public.user_integrations_decrypted
with (security_invoker = on) as
select id, user_id, whatsapp_phone_number_id,
  public.decrypt_credential(whatsapp_access_token)  as whatsapp_access_token,
  public.decrypt_credential(telegram_bot_token)     as telegram_bot_token,
  broker_name,
  public.decrypt_credential(broker_api_key)         as broker_api_key,
  public.decrypt_credential(broker_api_secret)      as broker_api_secret,
  broker_account_id, email_provider, email_smtp_host, email_smtp_port, email_smtp_user,
  public.decrypt_credential(email_smtp_password)    as email_smtp_password,
  email_imap_host, email_imap_port,
  public.decrypt_credential(email_oauth_token)      as email_oauth_token,
  calendar_provider,
  public.decrypt_credential(calendar_oauth_token)   as calendar_oauth_token,
  public.decrypt_credential(calendar_refresh_token) as calendar_refresh_token,
  public.decrypt_credential(coursera_oauth_token)   as coursera_oauth_token,
  public.decrypt_credential(coursera_refresh_token) as coursera_refresh_token,
  coursera_user_id, created_at, updated_at
from public.user_integrations;
revoke all on public.user_integrations_decrypted from public, anon;
grant select on public.user_integrations_decrypted to authenticated, service_role;