
ALTER TABLE public.ibkr_connections
  ADD COLUMN IF NOT EXISTS gateway_url text DEFAULT 'https://localhost:5000/v1/api',
  ADD COLUMN IF NOT EXISTS api_token text,
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS demo_mode boolean NOT NULL DEFAULT true;
