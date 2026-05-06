
-- Expense groups: each group can include a series of cost centres (categories) and/or spaces
CREATE TABLE public.expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own expense groups" ON public.expense_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own expense groups" ON public.expense_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own expense groups" ON public.expense_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own expense groups" ON public.expense_groups FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_expense_groups_updated_at
BEFORE UPDATE ON public.expense_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Members: a group can include cost centres (free-text matching expense.category) or specific spaces
CREATE TABLE public.expense_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('cost_centre','space')),
  member_value TEXT NOT NULL, -- category text or space_id (uuid as text)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_type, member_value)
);

CREATE INDEX idx_egm_group ON public.expense_group_members(group_id);
CREATE INDEX idx_egm_user ON public.expense_group_members(user_id);

ALTER TABLE public.expense_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own group members" ON public.expense_group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own group members" ON public.expense_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own group members" ON public.expense_group_members FOR DELETE USING (auth.uid() = user_id);
