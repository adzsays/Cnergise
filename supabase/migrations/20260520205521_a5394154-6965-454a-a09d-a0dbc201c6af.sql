-- Prevent users from self-approving or modifying approval-controlled feature access.
DROP POLICY IF EXISTS "Users update their subscriptions" ON public.user_feature_subscriptions;

CREATE POLICY "Admins update feature subscriptions"
ON public.user_feature_subscriptions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Users may request/access their own subscription rows, but approval state is controlled by admins.
DROP POLICY IF EXISTS "Users create their subscriptions" ON public.user_feature_subscriptions;
CREATE POLICY "Users request their own subscriptions"
ON public.user_feature_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'active')
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND revoked_at IS NULL
  AND revoke_reason IS NULL
  AND (
    status = 'pending'
    OR EXISTS (
      SELECT 1
      FROM public.app_features f
      WHERE f.key = feature_key
        AND f.requires_approval = false
        AND f.is_regulated = false
    )
  )
);

-- Realtime topics must now be explicitly tied to the signed-in user unless admin-only visitor chat.
DROP POLICY IF EXISTS "Users can subscribe to non visitor realtime" ON realtime.messages;
CREATE POLICY "Users can subscribe to own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() NOT ILIKE '%visitor_chat_sessions%'
  AND realtime.topic() NOT ILIKE '%visitor_chat_messages%'
  AND realtime.topic() LIKE '%' || auth.uid()::text || '%'
);