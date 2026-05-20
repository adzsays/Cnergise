
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy WHERE polrelid = 'realtime.messages'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.polname);
  END LOOP;
END $$;

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Admins can subscribe to visitor_chat topics
CREATE POLICY "Admins subscribe visitor chat"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'visitor_chat%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- All other topics MUST end with the subscriber's own auth.uid()
CREATE POLICY "Users subscribe own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() NOT LIKE 'visitor_chat%'
  AND realtime.topic() LIKE '%:' || auth.uid()::text
);

-- Authenticated users can broadcast/presence on topics they own (suffix match)
CREATE POLICY "Users write own topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'visitor_chat%' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  OR realtime.topic() LIKE '%:' || auth.uid()::text
);
