-- Add WhatsApp and Telegram identifiers to contacts table
ALTER TABLE public.contacts 
ADD COLUMN whatsapp_number text,
ADD COLUMN telegram_username text;

-- Create table to store external messaging history
CREATE TABLE public.external_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  content text NOT NULL,
  status text DEFAULT 'pending',
  external_message_id text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own external messages" 
ON public.external_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own external messages" 
ON public.external_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own external messages" 
ON public.external_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own external messages" 
ON public.external_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_external_messages_updated_at
BEFORE UPDATE ON public.external_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();