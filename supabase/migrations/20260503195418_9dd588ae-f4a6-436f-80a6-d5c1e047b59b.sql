
-- 1) Profiles: restrict SELECT to owner or admin
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Realtime: remove overly broad subscribe policy (app uses postgres_changes only)
DROP POLICY IF EXISTS "Authenticated can subscribe to realtime" ON realtime.messages;

-- 3) Agreements storage: add UPDATE/DELETE policies for owners and admins
CREATE POLICY "Users delete their own agreement files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'agreements'
    AND ((auth.uid())::text = (storage.foldername(name))[1]
         OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Users update their own agreement files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'agreements'
    AND ((auth.uid())::text = (storage.foldername(name))[1]
         OR public.has_role(auth.uid(), 'admin'))
  );
