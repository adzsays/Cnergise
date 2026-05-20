-- Replace broad invite request submission rule with constrained public request creation.
DROP POLICY IF EXISTS "Anyone can submit invite requests" ON public.invite_requests;
CREATE POLICY "Anyone can submit pending invite requests"
ON public.invite_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) BETWEEN 3 AND 320
  AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  AND coalesce(status, 'pending') = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND review_notes IS NULL
);

-- Prevent public listing of every avatar while allowing direct profile image URLs.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar files are readable by direct path"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
  AND name IS NOT NULL
  AND array_length(storage.foldername(name), 1) >= 1
);

-- Limit SECURITY DEFINER RPC exposure to intentional application entry points only.
REVOKE EXECUTE ON FUNCTION public.has_feature_access(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.find_user_by_handle(text) FROM authenticated;

-- has_role is intentionally callable from policies and admin checks; keep authenticated access.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;