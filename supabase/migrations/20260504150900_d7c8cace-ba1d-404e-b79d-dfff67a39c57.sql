
CREATE TABLE public.visitor_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE,
  visitor_name text,
  visitor_email text,
  page_url text,
  user_agent text,
  status text NOT NULL DEFAULT 'ai',
  unread_admin_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vcs_last_msg ON public.visitor_chat_sessions(last_message_at DESC);
CREATE INDEX idx_vcs_status ON public.visitor_chat_sessions(status);

CREATE TABLE public.visitor_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.visitor_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('visitor','assistant','admin','system')),
  content text NOT NULL,
  admin_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vcm_session ON public.visitor_chat_messages(session_id, created_at);

ALTER TABLE public.visitor_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sessions" ON public.visitor_chat_sessions FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update sessions" ON public.visitor_chat_sessions FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete sessions" ON public.visitor_chat_sessions FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins view messages" ON public.visitor_chat_messages FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert admin messages" ON public.visitor_chat_messages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') AND role = 'admin');
CREATE POLICY "Admins delete messages" ON public.visitor_chat_messages FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER vcs_updated_at BEFORE UPDATE ON public.visitor_chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_chat_messages;
ALTER TABLE public.visitor_chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.visitor_chat_messages REPLICA IDENTITY FULL;
