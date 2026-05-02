-- Wire Goals -> Projects -> Tasks hierarchy and Echo reality-check links

-- 1) Projects can roll up to a Goal
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_goal_id ON public.projects(goal_id);

-- 2) Goals belong to a Space (top-level container per chosen hierarchy)
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS space_id uuid;
CREATE INDEX IF NOT EXISTS idx_goals_space_id ON public.goals(space_id);

-- 3) Echo entries can attach to project/task in addition to existing goal_id
ALTER TABLE public.echo_entries
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_id    uuid REFERENCES public.tasks(id)    ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_echo_entries_project_id ON public.echo_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_echo_entries_task_id    ON public.echo_entries(task_id);
