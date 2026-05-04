
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

CREATE POLICY "Only admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins delete approval requests" ON public.feature_approval_queue;
CREATE POLICY "Admins delete approval requests"
  ON public.feature_approval_queue FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
