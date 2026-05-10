import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalsTab } from "@/components/plan/GoalsTab";
import { ProjectsTab } from "@/components/tasks/ProjectsTab";
import { TaskList } from "@/components/tasks/TaskList";
import { ProjectAnalyticsDashboard } from "@/components/projects/ProjectAnalyticsDashboard";
import EchoView from "@/components/echo/EchoView";
import { useGoals } from "@/hooks/useGoals";
import { BarChart3, Target, FolderKanban, CheckSquare, Mic, X } from "lucide-react";
import { useCurrentSpace } from "@/contexts/SpaceContext";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export default function Plan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "analytics";
  const { goals = [] } = useGoals();
  const { currentSpace } = useCurrentSpace();

  const filters = useMemo(() => ({
    goalId: searchParams.get("goal"),
    projectId: searchParams.get("project"),
    assigneeId: searchParams.get("assignee"),
  }), [searchParams]);
  const status = searchParams.get("status");

  const setTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", v);
    setSearchParams(next);
  };

  const updateFilters = (f: { goalId?: string | null; projectId?: string | null; assigneeId?: string | null }) => {
    const next = new URLSearchParams(searchParams);
    (["goal", "project", "assignee"] as const).forEach(k => {
      const v = f[(k === "goal" ? "goalId" : k === "project" ? "projectId" : "assigneeId") as keyof typeof f];
      if (v) next.set(k, v); else next.delete(k);
    });
    setSearchParams(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    next.set("tab", tab);
    setSearchParams(next);
  };

  const focusGoal = filters.goalId ? goals.find((g) => g.id === filters.goalId) : null;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Plan" />

            <main className="flex-1 overflow-auto p-3 md:p-6">
              <div className="max-w-7xl mx-auto space-y-4">
                <Card className="p-4 bg-muted/40 border-dashed">
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Flow:</span>{" "}
                    Start with <span className="font-medium text-foreground">Analytics</span> →
                    drill into <span className="font-medium text-foreground">Goals</span>,{" "}
                    <span className="font-medium text-foreground">Projects</span>, and{" "}
                    <span className="font-medium text-foreground">Tasks</span>.
                    Click any metric to jump straight to the matching items.
                    {currentSpace && <> Currently in <span className="font-medium text-foreground">{currentSpace.name}</span>.</>}
                  </p>
                </Card>

                <Tabs value={tab} onValueChange={setTab}>
                  <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                    <TabsList className="bg-muted/50 inline-flex min-w-max">
                      <TabsTrigger value="analytics" className="text-xs md:text-sm gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" />Analytics
                      </TabsTrigger>
                      <TabsTrigger value="goals" className="text-xs md:text-sm gap-1.5">
                        <Target className="h-3.5 w-3.5" />Goals
                      </TabsTrigger>
                      <TabsTrigger value="projects" className="text-xs md:text-sm gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5" />Projects
                      </TabsTrigger>
                      <TabsTrigger value="tasks" className="text-xs md:text-sm gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />Tasks
                      </TabsTrigger>
                      <TabsTrigger value="echo" className="text-xs md:text-sm gap-1.5">
                        <Mic className="h-3.5 w-3.5" />Echo
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="analytics" className="mt-4">
                    <ProjectAnalyticsDashboard
                      filters={filters}
                      onFiltersChange={updateFilters}
                    />
                  </TabsContent>

                  <TabsContent value="goals" className="mt-4">
                    <GoalsTab onSelectGoal={(goalId) => { updateFilters({ goalId }); setTab("projects"); }} />
                  </TabsContent>

                  <TabsContent value="projects" className="mt-4 space-y-3">
                    {focusGoal && (
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          Filtered by goal: <span className="font-medium">{focusGoal.title}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => updateFilters({ goalId: null })}>
                          <X className="h-3.5 w-3.5 mr-1" />Clear
                        </Button>
                      </div>
                    )}
                    <ProjectsTab filterGoalId={filters.goalId} />
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-4">
                    <TaskList
                      externalFilters={{ ...filters, status }}
                      onClearFilters={clearAll}
                    />
                  </TabsContent>

                  <TabsContent value="echo" className="mt-4">
                    <EchoView />
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </SidebarInset>

        <VoiceAssistant />
      </div>
    </SidebarProvider>
  );
}
