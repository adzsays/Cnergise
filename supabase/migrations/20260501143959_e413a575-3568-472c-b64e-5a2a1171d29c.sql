-- Attach triggers to auth.users so new signups get profile, default role, default space, and admin auto-assignment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_space ON auth.users;
CREATE TRIGGER on_auth_user_created_space
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_space_for_user();

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_to_specific_user();

DROP TRIGGER IF EXISTS on_auth_user_created_allowlist ON auth.users;
CREATE TRIGGER on_auth_user_created_allowlist
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email_on_signup();

-- Backfill: create profiles, default user role, default space, and admin role for existing users
INSERT INTO public.profiles (id, name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'user'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.spaces (user_id, name, description, color, is_default)
SELECT u.id, 'Personal', 'Your personal workspace', '#6366f1', true
FROM auth.users u
LEFT JOIN public.spaces s ON s.user_id = u.id AND s.is_default = true
WHERE s.id IS NULL;

-- Auto-assign admin role to adithyavshetty emails (backfill)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email ILIKE '%adithyavshetty%'
ON CONFLICT (user_id, role) DO NOTHING;