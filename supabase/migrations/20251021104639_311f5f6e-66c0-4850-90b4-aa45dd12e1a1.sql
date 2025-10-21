-- Create spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'on-hold', 'completed', 'archived')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create features table
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('planned', 'in-progress', 'completed')) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update tasks table to add project and assignee references
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feature_id UUID REFERENCES public.features(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spaces
CREATE POLICY "Users can view their own spaces"
  ON public.spaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spaces"
  ON public.spaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
  ON public.spaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
  ON public.spaces FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for teams
CREATE POLICY "Users can view their own teams"
  ON public.teams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for team_members
CREATE POLICY "Users can view members of their teams"
  ON public.team_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.user_id = auth.uid()
  ));

CREATE POLICY "Users can add members to their teams"
  ON public.team_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.user_id = auth.uid()
  ));

CREATE POLICY "Users can update members of their teams"
  ON public.team_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete members from their teams"
  ON public.team_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.user_id = auth.uid()
  ));

-- RLS Policies for features
CREATE POLICY "Users can view features of their projects"
  ON public.features FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = features.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create features for their projects"
  ON public.features FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = features.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update features of their projects"
  ON public.features FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = features.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete features from their projects"
  ON public.features FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = features.project_id
    AND projects.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER set_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();