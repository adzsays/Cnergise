-- Add new columns for broker, email, and calendar integrations
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS broker_name TEXT,
ADD COLUMN IF NOT EXISTS broker_api_key TEXT,
ADD COLUMN IF NOT EXISTS broker_api_secret TEXT,
ADD COLUMN IF NOT EXISTS broker_account_id TEXT,
ADD COLUMN IF NOT EXISTS email_provider TEXT,
ADD COLUMN IF NOT EXISTS email_smtp_host TEXT,
ADD COLUMN IF NOT EXISTS email_smtp_port INTEGER,
ADD COLUMN IF NOT EXISTS email_smtp_user TEXT,
ADD COLUMN IF NOT EXISTS email_smtp_password TEXT,
ADD COLUMN IF NOT EXISTS email_imap_host TEXT,
ADD COLUMN IF NOT EXISTS email_imap_port INTEGER,
ADD COLUMN IF NOT EXISTS email_oauth_token TEXT,
ADD COLUMN IF NOT EXISTS calendar_provider TEXT,
ADD COLUMN IF NOT EXISTS calendar_oauth_token TEXT,
ADD COLUMN IF NOT EXISTS calendar_refresh_token TEXT;