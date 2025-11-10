
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Target } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";

export default function Goals() {
  const [activeTab, setActiveTab] = React.useState("active");
  const { goals: allGoals, isLoading } = useGoals();
  
  const activeGoals = allGoals?.filter(goal => goal.status === 'active') || [];
  const completedGoals = allGoals?.filter(goal => goal.status === 'completed') || [];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <h1 className="text-2xl font-bold gradient-heading">Goals</h1>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </div>
            </header>
            
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { value: "active", label: "Active Goals" },
                { value: "completed", label: "Completed" },
                { value: "all", label: "All Goals" }
              ]}
              actions={
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Goal
                </Button>
              }
            />
            
            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading goals...</div>
                </div>
              ) : (
                <Tabs value={activeTab} className="w-full">
                  <TabsContent value="active" className="mt-0">
                    {activeGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeGoals.map(goal => (
                          <Card key={goal.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle>{goal.title}</CardTitle>
                                <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                                  {goal.category}
                                </span>
                              </div>
                              <CardDescription>{goal.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">Progress</span>
                                    <span className="text-sm">{goal.progress}%</span>
                                  </div>
                                  <Progress value={goal.progress} className="h-2" />
                                </div>
                                {goal.deadline && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Deadline:</span>
                                    <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm">Update</Button>
                                  <Button size="sm">Check-in</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Target className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg mb-2">No active goals</p>
                        <p className="text-sm">Create your first goal to get started!</p>
                      </div>
                    )}
                  </TabsContent>
                
                  <TabsContent value="completed">
                    {completedGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {completedGoals.map(goal => (
                          <Card key={goal.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle>{goal.title}</CardTitle>
                                <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                                  {goal.category}
                                </span>
                              </div>
                              <CardDescription>{goal.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">Progress</span>
                                    <span className="text-sm">{goal.progress}%</span>
                                  </div>
                                  <Progress value={goal.progress} className="h-2" />
                                </div>
                                {goal.completed_date && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Completed:</span>
                                    <span>{new Date(goal.completed_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Target className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg mb-2">No completed goals yet</p>
                        <p className="text-sm">Complete some goals to see them here!</p>
                      </div>
                    )}
                  </TabsContent>
                
                  <TabsContent value="all">
                    {allGoals && allGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allGoals.map(goal => (
                          <Card key={goal.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle>{goal.title}</CardTitle>
                                <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                                  {goal.category}
                                </span>
                              </div>
                              <CardDescription>{goal.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">Progress</span>
                                    <span className="text-sm">{goal.progress}%</span>
                                  </div>
                                  <Progress value={goal.progress} className="h-2" />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {goal.completed_date ? 'Completed:' : 'Deadline:'}
                                  </span>
                                  <span>
                                    {goal.completed_date 
                                      ? new Date(goal.completed_date).toLocaleDateString()
                                      : goal.deadline 
                                        ? new Date(goal.deadline).toLocaleDateString()
                                        : 'No deadline'
                                    }
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Target className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg mb-2">No goals yet</p>
                        <p className="text-sm">Create your first goal to get started!</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
