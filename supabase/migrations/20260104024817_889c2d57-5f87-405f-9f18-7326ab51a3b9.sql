-- Create learning courses table
CREATE TABLE public.learning_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    space_id UUID REFERENCES public.spaces(id),
    
    -- Course details
    title TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'coursera', -- 'coursera', 'udemy', 'linkedin', etc.
    course_url TEXT,
    image_url TEXT,
    instructor TEXT,
    description TEXT,
    
    -- Progress tracking
    status TEXT NOT NULL DEFAULT 'enrolled', -- 'enrolled', 'in_progress', 'completed', 'dropped'
    progress_percent INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Coursera-specific fields
    external_course_id TEXT, -- Coursera course ID
    certificate_url TEXT,
    estimated_hours INTEGER,
    
    -- Sync metadata
    synced_from_provider BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own courses" 
ON public.learning_courses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" 
ON public.learning_courses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" 
ON public.learning_courses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" 
ON public.learning_courses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_learning_courses_updated_at
    BEFORE UPDATE ON public.learning_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add Coursera OAuth fields to user_integrations
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS coursera_oauth_token TEXT,
ADD COLUMN IF NOT EXISTS coursera_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS coursera_user_id TEXT;