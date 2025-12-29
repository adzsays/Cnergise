-- Create a system_settings table for app-wide settings like API keys (admin-only access)
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view system settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert system settings
CREATE POLICY "Admins can insert system settings"
ON public.system_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update system settings
CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete system settings
CREATE POLICY "Admins can delete system settings"
ON public.system_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-assign admin to specific user on signup
CREATE OR REPLACE FUNCTION public.assign_admin_to_specific_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email matches the admin email
  IF NEW.email = 'adithyavshetty@gmail.com' OR NEW.email ILIKE '%adithyavshetty%' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_to_specific_user();