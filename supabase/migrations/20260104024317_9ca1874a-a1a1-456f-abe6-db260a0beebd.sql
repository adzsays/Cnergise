-- Create unified metadata table for cross-app event linking
CREATE TABLE public.unified_metadata (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    space_id UUID REFERENCES public.spaces(id),
    
    -- Source information
    source_type TEXT NOT NULL, -- 'email', 'calendar', 'finance', 'task', 'goal', 'contact', 'chat'
    source_id UUID NOT NULL, -- ID in the source table
    source_table TEXT NOT NULL, -- Table name for deep linking
    
    -- Searchable metadata (extracted for AI search)
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT[], -- AI-extracted keywords for cross-linking
    participants TEXT[], -- People involved (email addresses, names)
    amount NUMERIC, -- For financial transactions
    date_occurred TIMESTAMP WITH TIME ZONE,
    
    -- AI-generated embeddings placeholder
    ai_summary TEXT, -- AI-generated summary for search
    
    -- Notification status
    is_notification BOOLEAN DEFAULT false,
    notification_priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    notification_read BOOLEAN DEFAULT false,
    notification_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Deep link for opening external apps
    external_url TEXT,
    app_type TEXT, -- 'gmail', 'google_calendar', 'finexer', etc.
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unified_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own metadata" 
ON public.unified_metadata 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metadata" 
ON public.unified_metadata 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metadata" 
ON public.unified_metadata 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metadata" 
ON public.unified_metadata 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for fast searches
CREATE INDEX idx_unified_metadata_user_source ON public.unified_metadata(user_id, source_type);
CREATE INDEX idx_unified_metadata_keywords ON public.unified_metadata USING GIN(keywords);
CREATE INDEX idx_unified_metadata_notifications ON public.unified_metadata(user_id, is_notification, notification_read) WHERE is_notification = true;

-- Add updated_at trigger
CREATE TRIGGER update_unified_metadata_updated_at
    BEFORE UPDATE ON public.unified_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create AI search history for context
CREATE TABLE public.ai_search_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    query TEXT NOT NULL,
    results JSONB,
    metadata_ids UUID[], -- IDs of unified_metadata records returned
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history" 
ON public.ai_search_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" 
ON public.ai_search_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);