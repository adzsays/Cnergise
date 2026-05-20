-- Consolidate invite-only signup enforcement to a single backend trigger
DROP TRIGGER IF EXISTS trg_enforce_allowed_email ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_allowlist ON auth.users;
DROP TRIGGER IF EXISTS enforce_allowed_email_on_signup_trg ON auth.users;
DROP TRIGGER IF EXISTS enforce_allowed_email_before_signup ON auth.users;

CREATE TRIGGER enforce_allowed_email_before_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_allowed_email_on_signup();

-- Realtime subscription metadata hardening
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can subscribe to visitor chat realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Users can subscribe to owned realtime topics" ON realtime.messages;

-- Visitor chat contains PII and is only for admins.
CREATE POLICY "Admins can subscribe to visitor chat realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() ILIKE '%visitor_chat_sessions%'
   OR realtime.topic() ILIKE '%visitor_chat_messages%')
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Non-visitor realtime topics still require authentication. Row-level table RLS
-- remains the authoritative data filter for postgres_changes payloads.
CREATE POLICY "Users can subscribe to non visitor realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() NOT ILIKE '%visitor_chat_sessions%'
  AND realtime.topic() NOT ILIKE '%visitor_chat_messages%'
);

-- Keep visitor chat browser writes disabled; all visitor chat writes go through the backend function.
DROP POLICY IF EXISTS "Visitors can create chat sessions" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Visitors can insert chat messages" ON public.visitor_chat_messages;