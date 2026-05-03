
-- 1) Restrict profiles SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2) Revoke EXECUTE on SECURITY DEFINER helper functions from anon/public.
-- Keep `find_user_by_handle` callable by authenticated users (used by contact discovery).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_email_allowed(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_feature_access(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.find_user_by_handle(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_default_space_for_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_admin_to_specific_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.normalize_invite_email() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_invite_approval() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_handle() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recalc_invoice_totals() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.normalize_allowed_email() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_allowed_email_on_signup() FROM anon, authenticated, public;
