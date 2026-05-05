import React, { useState } from "react";
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
import { Target, FolderKanban, CheckSquare, BarChart3, Mic, X } from "lucide-react";
import { useCurrentSpace } from "@/contexts/SpaceContext";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { AIBriefCard } from "@/components/ai/AIBriefCard";

export default function Plan() {
  const [tab, setTab] = useState("goals");
  const [focusGoalId, setFocusGoalId] = useState<string | null>(null);
  const { goals = [] } = useGoals();
  const { currentSpace } = useCurrentSpace();

  const focusGoal = focusGoalId ? goals.find((g) => g.id === focusGoalId) : null;

  const goToProjectsForGoal = (goalId: string) => {
    setFocusGoalId(goalId);
    setTab("projects");
  };

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
                    Pick a <span className="font-medium text-foreground">Space</span> (an idea or company) →
                    set <span className="font-medium text-foreground">Goals</span> →
                    break them into <span className="font-medium text-foreground">Projects</span> →
                    work on granular <span className="font-medium text-foreground">Tasks</span>.
                    Use <span className="font-medium text-foreground">Echo</span> to log what really happened.
                    {currentSpace && <> Currently in <span className="font-medium text-foreground">{currentSpace.name}</span>.</>}
                  </p>
                </Card>

                <AIBriefCard scope="plan" title="Plan AI brief" />

                <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v !== "projects") setFocusGoalId(null); }}>
                  <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                    <TabsList className="bg-muted/50 inline-flex min-w-max">
                      <TabsTrigger value="goals" className="text-xs md:text-sm gap-1.5">
                        <Target className="h-3.5 w-3.5" />Goals
                      </TabsTrigger>
                      <TabsTrigger value="projects" className="text-xs md:text-sm gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5" />Projects
                      </TabsTrigger>
                      <TabsTrigger value="tasks" className="text-xs md:text-sm gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />Tasks
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="text-xs md:text-sm gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" />Analytics
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="goals" className="mt-4">
                    <GoalsTab onSelectGoal={goToProjectsForGoal} />
                  </TabsContent>

                  <TabsContent value="projects" className="mt-4 space-y-3">
                    {focusGoal && (
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          Filtered by goal: <span className="font-medium">{focusGoal.title}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => setFocusGoalId(null)}>
                          <X className="h-3.5 w-3.5 mr-1" />Clear
                        </Button>
                      </div>
                    )}
                    <ProjectsTab filterGoalId={focusGoalId} />
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-4">
                    <TaskList />
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-4">
                    <ProjectAnalyticsDashboard />
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
