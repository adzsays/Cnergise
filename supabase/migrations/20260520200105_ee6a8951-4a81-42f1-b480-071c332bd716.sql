ALTER TABLE public.visitor_chat_sessions ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS idx_visitor_chat_sessions_ip_created ON public.visitor_chat_sessions(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_chat_messages_session_role_created ON public.visitor_chat_messages(session_id, role, created_at DESC);