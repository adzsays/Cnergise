import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Timer, Moon, ArrowUpRight, ArrowDownRight, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HealthSourceHub } from "@/components/health/HealthSourceHub";
import { SleekChart } from "@/components/ui/SleekChart";

type Metric = {
  metric_date: string;
  steps: number | null;
  distance_meters: number | null;
  calories_burned: number | null;
  active_minutes: number | null;
  resting_heart_rate: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  sleep_minutes: number | null;
  weight_kg: number | null;
};

const STEPS_GOAL = 10000;
const WATER_GOAL = 2.5;

export default function Health() {
  const [activeTab, setActiveTab] = React.useState("overview");

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["health-metrics"],
    queryFn: async (): Promise<Metric[]> => {
      const { data } = await supabase
        .from("health_metrics")
        .select("metric_date,steps,distance_meters,calories_burned,active_minutes,resting_heart_rate,avg_heart_rate,max_heart_rate,sleep_minutes,weight_kg")
        .order("metric_date", { ascending: false })
        .limit(60);
      return (data ?? []) as Metric[];
    },
  });

  const today = metrics[0];
  const prev = metrics[1];

  const sleepData = React.useMemo(
    () =>
      [...metrics]
        .slice(0, 7)
        .reverse()
        .map((m) => ({
          day: new Date(m.metric_date).toLocaleDateString("en", { weekday: "short" }),
          hours: m.sleep_minutes ? +(m.sleep_minutes / 60).toFixed(1) : 0,
        })),
    [metrics],
  );

  const activityData = React.useMemo(
    () =>
      [...metrics].slice(0, 30).reverse().map((m) => ({
        date: m.metric_date.slice(5),
        steps: m.steps ?? 0,
      })),
    [metrics],
  );

  const sleepHistoryData = React.useMemo(
    () =>
      [...metrics].slice(0, 30).reverse().map((m) => ({
        date: m.metric_date.slice(5),
        hours: m.sleep_minutes ? +(m.sleep_minutes / 60).toFixed(1) : 0,
      })),
    [metrics],
  );

  const avgSleep = sleepData.length ? +(sleepData.reduce((s, d) => s + d.hours, 0) / sleepData.length).toFixed(1) : 0;
  const avgSteps = activityData.length ? Math.round(activityData.reduce((s, d) => s + d.steps, 0) / activityData.length) : 0;

  const steps = today?.steps ?? 0;
  const stepsPct = Math.min(100, Math.round((steps / STEPS_GOAL) * 100));
  const hrCurrent = today?.avg_heart_rate ?? 0;
  const hrResting = today?.resting_heart_rate ?? 0;
  const hrPrev = prev?.avg_heart_rate ?? 0;

  const hasData = metrics.length > 0;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Health" />

            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
              <HealthSourceHub />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="activity" className="text-sm">Activity</TabsTrigger>
                    <TabsTrigger value="nutrition" className="text-sm">Nutrition</TabsTrigger>
                    <TabsTrigger value="sleep" className="text-sm">Sleep</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="mt-0">
                  {!isLoading && !hasData && (
                    <Card className="mb-6">
                      <CardContent className="py-10 text-center text-muted-foreground">
                        No health data yet — connect a source above to get started.
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          Heart Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold mb-1">{hrCurrent || "—"}</div>
                          <div className="text-sm text-muted-foreground">avg bpm</div>
                        </div>
                        <div className="flex justify-between text-sm pt-2">
                          <div>
                            <div className="text-muted-foreground">Resting</div>
                            <div>{hrResting || "—"} bpm</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground">Previous</div>
                            <div className="flex items-center">
                              {hrPrev || "—"} bpm
                              {hrCurrent && hrPrev ? (
                                hrCurrent < hrPrev ? (
                                  <ArrowDownRight className="h-4 w-4 text-green-500 ml-1" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-red-500 ml-1" />
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-blue-500" />
                          Steps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold mb-1">{steps.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">steps · latest day</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{stepsPct}%</span>
                          </div>
                          <Progress value={stepsPct} className="h-2" />
                          <div className="text-xs text-right text-muted-foreground">
                            Goal: {STEPS_GOAL.toLocaleString()} steps
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          Calories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold mb-1">
                            {today?.calories_burned ? Math.round(today.calories_burned) : "—"}
                          </div>
                          <div className="text-sm text-muted-foreground">kcal burned</div>
                        </div>
                        <div className="flex justify-between text-sm pt-2">
                          <div>
                            <div className="text-muted-foreground">Active</div>
                            <div>{today?.active_minutes ?? "—"} min</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground">Distance</div>
                            <div>
                              {today?.distance_meters
                                ? (today.distance_meters / 1000).toFixed(2) + " km"
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="md:col-span-3">
                      <SleekChart
                        kind="area"
                        data={sleepData}
                        xKey="day"
                        series={[{ key: "hours", label: "Hours slept", hsl: "238 70% 65%" }]}
                        title="Sleep"
                        subtitle="Last 7 days"
                        kpi={`${avgSleep}h`}
                        valueFormatter={(v) => `${v}h`}
                        compactHeight={120}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity">
                  <SleekChart
                    kind="area"
                    data={activityData}
                    xKey="date"
                    series={[{ key: "steps", label: "Steps", hsl: "199 89% 48%" }]}
                    title="Activity"
                    subtitle="Steps · last 30 days"
                    kpi={avgSteps.toLocaleString()}
                    valueFormatter={(v) => v.toLocaleString()}
                    compactHeight={140}
                  />
                </TabsContent>

                <TabsContent value="nutrition">
                  <Card>
                    <CardHeader><CardTitle>Nutrition</CardTitle></CardHeader>
                    <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                      Samsung Health export does not include nutrition data.
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sleep">
                  <SleekChart
                    kind="area"
                    data={sleepHistoryData}
                    xKey="date"
                    series={[{ key: "hours", label: "Hours", hsl: "238 70% 65%" }]}
                    title="Sleep history"
                    subtitle="Last 30 days"
                    kpi={`${avgSleep}h`}
                    valueFormatter={(v) => `${v}h`}
                    compactHeight={140}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>

        
      </div>
    </SidebarProvider>
  );
}
