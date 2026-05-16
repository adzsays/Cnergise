-- Enums
CREATE TYPE public.health_goal_type AS ENUM ('weight_loss','weight_gain','maintain','strength','endurance','nutrition','sleep','custom');
CREATE TYPE public.meal_type AS ENUM ('breakfast','lunch','dinner','snack','drink');
CREATE TYPE public.vital_type AS ENUM ('bp_systolic','bp_diastolic','glucose','cholesterol_total','cholesterol_ldl','cholesterol_hdl','triglycerides','resting_hr','hrv','spo2','body_temp','body_fat_pct','muscle_mass_kg','waist_cm','custom');

-- Health goals
CREATE TABLE public.health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  goal_type public.health_goal_type NOT NULL DEFAULT 'custom',
  baseline_value NUMERIC,
  target_value NUMERIC,
  target_unit TEXT,
  target_date DATE,
  linked_plan_goal_id UUID,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own health goals" ON public.health_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own health goals" ON public.health_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own health goals" ON public.health_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own health goals" ON public.health_goals FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_health_goals_user_active ON public.health_goals(user_id, is_active);
CREATE TRIGGER trg_health_goals_updated BEFORE UPDATE ON public.health_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Nutrition log
CREATE TABLE public.nutrition_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meal_type public.meal_type NOT NULL DEFAULT 'snack',
  food_name TEXT NOT NULL,
  servings NUMERIC DEFAULT 1,
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  water_ml NUMERIC,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own nutrition" ON public.nutrition_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nutrition" ON public.nutrition_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nutrition" ON public.nutrition_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nutrition" ON public.nutrition_log FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_nutrition_user_logged ON public.nutrition_log(user_id, logged_at DESC);
CREATE TRIGGER trg_nutrition_log_updated BEFORE UPDATE ON public.nutrition_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Health vitals
CREATE TABLE public.health_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vital_type public.vital_type NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own vitals" ON public.health_vitals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vitals" ON public.health_vitals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vitals" ON public.health_vitals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own vitals" ON public.health_vitals FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_vitals_user_recorded ON public.health_vitals(user_id, recorded_at DESC);
CREATE TRIGGER trg_health_vitals_updated BEFORE UPDATE ON public.health_vitals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mood log
CREATE TABLE public.mood_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  stress_score INTEGER CHECK (stress_score BETWEEN 1 AND 10),
  energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mood_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own mood" ON public.mood_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mood" ON public.mood_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mood" ON public.mood_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mood" ON public.mood_log FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_mood_user_logged ON public.mood_log(user_id, logged_at DESC);
CREATE TRIGGER trg_mood_log_updated BEFORE UPDATE ON public.mood_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();