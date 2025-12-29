
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Target, CheckCircle2, Clock } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { SkeletonCard } from "@/components/ui/DashboardWidget";

export default function Goals() {
  const [activeTab, setActiveTab] = React.useState("active");
  const { goals: allGoals, isLoading } = useGoals();
  
  const activeGoals = allGoals?.filter(goal => goal.status === 'active') || [];
  const completedGoals = allGoals?.filter(goal => goal.status === 'completed') || [];

  const GoalCard = ({ goal }: { goal: any }) => (
    <Card className="bg-card border border-border rounded-md shadow-card transition-shadow duration-150 hover:shadow-card-hover">
      <CardHeader className="px-4 py-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="text-sm mt-1 line-clamp-2">{goal.description}</CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {goal.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:px-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Progress</span>
              <span className="text-sm font-medium tabular-nums">{goal.progress}%</span>
            </div>
            <Progress 
              value={goal.progress} 
              className="h-2"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {goal.completed_date ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span>Completed</span>
                </>
              ) : goal.deadline ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Due</span>
                </>
              ) : null}
            </div>
            <span className="text-sm">
              {goal.completed_date 
                ? new Date(goal.completed_date).toLocaleDateString()
                : goal.deadline 
                  ? new Date(goal.deadline).toLocaleDateString()
                  : ''
              }
            </span>
          </div>
          
          {goal.status === 'active' && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="text-xs h-8">Update</Button>
              <Button size="sm" className="text-xs h-8">Check-in</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Target className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-base font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Goals" />
            
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
                    <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
                    <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
                  </TabsList>
                  
                  <Button size="sm" className="h-9">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Goal
                  </Button>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3].map((i) => (
                      <SkeletonCard key={i} lines={4} />
                    ))}
                  </div>
                ) : (
                  <>
                    <TabsContent value="active" className="mt-0">
                      {activeGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                          {activeGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState 
                          title="No active goals"
                          description="Create your first goal to start tracking your progress."
                        />
                      )}
                    </TabsContent>
                  
                    <TabsContent value="completed" className="mt-0">
                      {completedGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                          {completedGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState 
                          title="No completed goals"
                          description="Goals you complete will appear here."
                        />
                      )}
                    </TabsContent>
                  
                    <TabsContent value="all" className="mt-0">
                      {allGoals && allGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                          {allGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState 
                          title="No goals yet"
                          description="Create your first goal to get started!"
                        />
                      )}
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
