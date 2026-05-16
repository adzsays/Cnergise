import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Heart, Timer, Moon, Flame, Droplet, Activity, Target, Apple, HeartPulse, Smile,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HealthSourceHub } from "@/components/health/HealthSourceHub";
import { SleekChart } from "@/components/ui/SleekChart";
import { HealthGoalsView } from "@/components/health/HealthGoalsView";
import { NutritionView } from "@/components/health/NutritionView";
import { VitalsView } from "@/components/health/VitalsView";
import { MoodView } from "@/components/health/MoodView";

type Metric = {
  metric_date: string;
  steps: number | null;
  distance_meters: number | null;
  calories_burned: number | null;
  active_minutes: number | null;
  resting_heart_rate: number | null;
  avg_heart_rate: number | null;
  sleep_minutes: number | null;
  weight_kg: number | null;
};

type NutritionRow = { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; water_ml: number | null; logged_at: string };
type Vital = { vital_type: string; value: number; recorded_at: string; unit: string | null };
type Mood = { mood_score: number | null; stress_score: number | null; energy_score: number | null; logged_at: string };

const STEPS_GOAL = 10000;
const CAL_GOAL = 2000;
const WATER_GOAL_ML = 2500;

const VIEWS = [
  { value: "today", label: "Today", icon: Activity },
  { value: "goals", label: "Goals & weight", icon: Target },
  { value: "nutrition", label: "Food & nutrition", icon: Apple },
  { value: "activity", label: "Activity & sleep", icon: Timer },
  { value: "vitals", label: "Vitals & labs", icon: HeartPulse },
  { value: "mood", label: "Mood & stress", icon: Smile },
] as const;

export default function Health() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [view, setView] = React.useState<string>(params.get("view") || "today");

  React.useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState({}, "", url.toString());
  }, [view]);

  const { data: metrics = [] } = useQuery({
    queryKey: ["health-metrics"],
    queryFn: async (): Promise<Metric[]> => {
      const { data } = await supabase
        .from("health_metrics")
        .select("metric_date,steps,distance_meters,calories_burned,active_minutes,resting_heart_rate,avg_heart_rate,sleep_minutes,weight_kg")
        .order("metric_date", { ascending: false })
        .limit(60);
      return (data ?? []) as Metric[];
    },
  });

  const { data: nutritionToday = [] } = useQuery({
    queryKey: ["nutrition-today"],
    queryFn: async (): Promise<NutritionRow[]> => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("nutrition_log")
        .select("calories,protein_g,carbs_g,fat_g,water_ml,logged_at")
        .gte("logged_at", start.toISOString());
      return (data ?? []) as NutritionRow[];
    },
  });

  const { data: latestVitals = [] } = useQuery({
    queryKey: ["health-vitals-recent"],
    queryFn: async (): Promise<Vital[]> => {
      const since = new Date(); since.setDate(since.getDate() - 14);
      const { data } = await supabase
        .from("health_vitals")
        .select("vital_type,value,recorded_at,unit")
        .gte("recorded_at", since.toISOString())
        .order("recorded_at", { ascending: false });
      return (data ?? []) as Vital[];
    },
  });

  const { data: moodToday } = useQuery({
    queryKey: ["mood-today"],
    queryFn: async (): Promise<Mood | null> => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("mood_log")
        .select("mood_score,stress_score,energy_score,logged_at")
        .gte("logged_at", start.toISOString())
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as Mood | null;
    },
  });

  const { data: activeGoal } = useQuery({
    queryKey: ["active-health-goal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("health_goals")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const today = metrics[0];
  const steps = today?.steps ?? 0;
  const stepsPct = Math.min(100, Math.round((steps / STEPS_GOAL) * 100));

  const caloriesIn = nutritionToday.reduce((s, n) => s + (Number(n.calories) || 0), 0);
  const protein = nutritionToday.reduce((s, n) => s + (Number(n.protein_g) || 0), 0);
  const carbs = nutritionToday.reduce((s, n) => s + (Number(n.carbs_g) || 0), 0);
  const fat = nutritionToday.reduce((s, n) => s + (Number(n.fat_g) || 0), 0);
  const water = nutritionToday.reduce((s, n) => s + (Number(n.water_ml) || 0), 0);
  const macroTotal = protein + carbs + fat || 1;
  const caloriesOut = today?.calories_burned ?? 0;

  const latestByType = React.useMemo(() => {
    const m = new Map<string, Vital>();
    latestVitals.forEach((v) => { if (!m.has(v.vital_type)) m.set(v.vital_type, v); });
    return m;
  }, [latestVitals]);

  const sleepData = React.useMemo(
    () => [...metrics].slice(0, 7).reverse().map((m) => ({
      day: new Date(m.metric_date).toLocaleDateString("en", { weekday: "short" }),
      hours: m.sleep_minutes ? +(m.sleep_minutes / 60).toFixed(1) : 0,
    })),
    [metrics],
  );
  const avgSleep = sleepData.length ? +(sleepData.reduce((s, d) => s + d.hours, 0) / sleepData.length).toFixed(1) : 0;

  // Goal progress
  let goalProgress: { pct: number; current: number; label: string } | null = null;
  if (activeGoal) {
    const baseline = Number(activeGoal.baseline_value) || 0;
    const target = Number(activeGoal.target_value) || 0;
    const currentWeight = today?.weight_kg ?? baseline;
    if (activeGoal.goal_type === "weight_loss" && baseline > target) {
      const total = baseline - target;
      const done = baseline - currentWeight;
      goalProgress = { pct: Math.max(0, Math.min(100, (done / total) * 100)), current: currentWeight, label: `${done.toFixed(1)} / ${total.toFixed(1)} ${activeGoal.target_unit || "kg"}` };
    } else if (activeGoal.goal_type === "weight_gain" && target > baseline) {
      const total = target - baseline;
      const done = currentWeight - baseline;
      goalProgress = { pct: Math.max(0, Math.min(100, (done / total) * 100)), current: currentWeight, label: `${done.toFixed(1)} / ${total.toFixed(1)} ${activeGoal.target_unit || "kg"}` };
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Health" />

            <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">

              {/* View selector — dropdown nav */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">Your health</h1>
                  <p className="text-xs text-muted-foreground">Goal-linked tracking across body, food, vitals & mood</p>
                </div>
                <Select value={view} onValueChange={setView}>
                  <SelectTrigger className="w-[180px] md:w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIEWS.map((v) => {
                      const I = v.icon;
                      return (
                        <SelectItem key={v.value} value={v.value}>
                          <span className="flex items-center gap-2"><I className="h-4 w-4" />{v.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {view === "today" && (
                <div className="space-y-4">
                  {/* Goal hero */}
                  {goalProgress ? (
                    <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Active goal</p>
                          <h2 className="text-lg font-semibold mt-1">{activeGoal?.title}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{goalProgress.pct.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">{goalProgress.label}</p>
                        </div>
                      </div>
                      <Progress value={goalProgress.pct} className="h-2" />
                    </Card>
                  ) : (
                    <Card className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No active health goal — switch to <button onClick={() => setView("goals")} className="text-primary underline">Goals</button> to add one (e.g. lose 5 kg)</p>
                    </Card>
                  )}

                  {/* Today grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="h-3 w-3 text-orange-500" />Calories</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{caloriesIn.toFixed(0)} <span className="text-xs text-muted-foreground">/ {CAL_GOAL}</span></p>
                      <Progress value={Math.min(100, (caloriesIn / CAL_GOAL) * 100)} className="h-1 mt-2" />
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Timer className="h-3 w-3 text-blue-500" />Steps</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{steps.toLocaleString()}</p>
                      <Progress value={stepsPct} className="h-1 mt-2" />
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Moon className="h-3 w-3 text-indigo-500" />Sleep</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{today?.sleep_minutes ? (today.sleep_minutes / 60).toFixed(1) + "h" : "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">avg {avgSleep}h · 7d</p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Droplet className="h-3 w-3 text-cyan-500" />Water</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{(water / 1000).toFixed(1)}L</p>
                      <Progress value={Math.min(100, (water / WATER_GOAL_ML) * 100)} className="h-1 mt-2" />
                    </Card>
                  </div>

                  {/* Macros */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">Today's macros</h3>
                      <p className="text-xs text-muted-foreground">{caloriesIn.toFixed(0)} in · {caloriesOut.toFixed(0)} out · net {(caloriesIn - caloriesOut).toFixed(0)} kcal</p>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div className="bg-rose-500" style={{ width: `${(protein / macroTotal) * 100}%` }} title={`Protein ${protein.toFixed(0)}g`} />
                      <div className="bg-amber-500" style={{ width: `${(carbs / macroTotal) * 100}%` }} title={`Carbs ${carbs.toFixed(0)}g`} />
                      <div className="bg-emerald-500" style={{ width: `${(fat / macroTotal) * 100}%` }} title={`Fat ${fat.toFixed(0)}g`} />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />Protein {protein.toFixed(0)}g</span>
                      <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />Carbs {carbs.toFixed(0)}g</span>
                      <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />Fat {fat.toFixed(0)}g</span>
                    </div>
                  </Card>

                  {/* Vitals snapshot */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Heart className="h-3 w-3 text-red-500" />Resting HR</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{today?.resting_heart_rate ?? latestByType.get("resting_hr")?.value ?? "—"} <span className="text-xs text-muted-foreground">bpm</span></p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><HeartPulse className="h-3 w-3 text-red-500" />Blood pressure</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">
                        {latestByType.get("bp_systolic") ? `${latestByType.get("bp_systolic")!.value}/${latestByType.get("bp_diastolic")?.value ?? "—"}` : "—"}
                      </p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Activity className="h-3 w-3 text-purple-500" />Glucose</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{latestByType.get("glucose")?.value ?? "—"} <span className="text-xs text-muted-foreground">{latestByType.get("glucose")?.unit || "mg/dL"}</span></p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Smile className="h-3 w-3 text-yellow-500" />Mood</div>
                      <p className="text-xl font-semibold mt-1 tabular-nums">{moodToday?.mood_score ?? "—"}<span className="text-xs text-muted-foreground">/10</span></p>
                      <p className="text-[10px] text-muted-foreground mt-1">stress {moodToday?.stress_score ?? "—"} · energy {moodToday?.energy_score ?? "—"}</p>
                    </Card>
                  </div>

                  {/* Sleep chart */}
                  <SleekChart
                    kind="area"
                    data={sleepData}
                    xKey="day"
                    series={[{ key: "hours", label: "Hours slept", hsl: "238 70% 65%" }]}
                    title="Sleep · 7 days"
                    kpi={`${avgSleep}h`}
                    valueFormatter={(v) => `${v}h`}
                    compactHeight={120}
                  />

                  <HealthSourceHub />
                </div>
              )}

              {view === "goals" && <HealthGoalsView />}
              {view === "nutrition" && <NutritionView />}
              {view === "activity" && (
                <div className="space-y-4">
                  <SleekChart
                    kind="area"
                    data={[...metrics].slice(0, 30).reverse().map((m) => ({ date: m.metric_date.slice(5), steps: m.steps ?? 0 }))}
                    xKey="date"
                    series={[{ key: "steps", label: "Steps", hsl: "199 89% 48%" }]}
                    title="Steps · 30 days"
                    kpi={metrics.length ? Math.round(metrics.slice(0, 30).reduce((s, m) => s + (m.steps ?? 0), 0) / Math.min(30, metrics.length)).toLocaleString() : "0"}
                    valueFormatter={(v) => v.toLocaleString()}
                    compactHeight={140}
                  />
                  <SleekChart
                    kind="area"
                    data={[...metrics].slice(0, 30).reverse().map((m) => ({ date: m.metric_date.slice(5), hours: m.sleep_minutes ? +(m.sleep_minutes / 60).toFixed(1) : 0 }))}
                    xKey="date"
                    series={[{ key: "hours", label: "Hours", hsl: "238 70% 65%" }]}
                    title="Sleep · 30 days"
                    kpi={`${avgSleep}h`}
                    valueFormatter={(v) => `${v}h`}
                    compactHeight={140}
                  />
                  <HealthSourceHub />
                </div>
              )}
              {view === "vitals" && <VitalsView />}
              {view === "mood" && <MoodView />}

            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
