-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY "Users can view their own contacts"
ON public.contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
ON public.contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
ON public.contacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
ON public.contacts FOR DELETE
USING (auth.uid() = user_id);

-- Create chat_channels table (for Slack-like channels)
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_channels
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_channels
CREATE POLICY "Users can view their own channels"
ON public.chat_channels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channels"
ON public.chat_channels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
ON public.chat_channels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
ON public.chat_channels FOR DELETE
USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create trigger for updated_at on contacts
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on chat_channels
CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on chat_messages
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();