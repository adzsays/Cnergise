CREATE TABLE IF NOT EXISTS public.alpaca_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nickname text,
  api_key_id text,
  api_secret text,
  environment text NOT NULL DEFAULT 'paper',
  base_url text,
  demo_mode boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'disconnected',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alpaca_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own alpaca connection"
ON public.alpaca_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_alpaca_connections_updated
BEFORE UPDATE ON public.alpaca_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();