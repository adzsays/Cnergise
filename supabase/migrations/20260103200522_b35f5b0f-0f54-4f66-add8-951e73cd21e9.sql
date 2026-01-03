-- Add space_id to all relevant tables for space-based filtering

-- Add space_id to financial_accounts
ALTER TABLE public.financial_accounts 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to chat_channels
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to emails
ALTER TABLE public.emails 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to goals
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add space_id to physical_assets
ALTER TABLE public.physical_assets 
ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Add is_default column to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Create function to auto-create default Personal space for new users
CREATE OR REPLACE FUNCTION public.create_default_space_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.spaces (user_id, name, description, color, is_default)
  VALUES (NEW.id, 'Personal', 'Your personal workspace', '#6366f1', true);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create space on profile creation
DROP TRIGGER IF EXISTS on_profile_created_create_space ON public.profiles;
CREATE TRIGGER on_profile_created_create_space
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_space_for_user();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_accounts_space_id ON public.financial_accounts(space_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_space_id ON public.financial_transactions(space_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_space_id ON public.calendar_events(space_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_space_id ON public.chat_channels(space_id);
CREATE INDEX IF NOT EXISTS idx_contacts_space_id ON public.contacts(space_id);
CREATE INDEX IF NOT EXISTS idx_emails_space_id ON public.emails(space_id);
CREATE INDEX IF NOT EXISTS idx_goals_space_id ON public.goals(space_id);
CREATE INDEX IF NOT EXISTS idx_physical_assets_space_id ON public.physical_assets(space_id);