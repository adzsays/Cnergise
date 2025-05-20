
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Target } from "lucide-react";

export default function Goals() {
  const [activeTab, setActiveTab] = React.useState("active");
  
  const goals = [
    {
      id: 1,
      title: "Complete Project X",
      description: "Finish all remaining tasks for Project X delivery",
      progress: 75,
      deadline: "June 30, 2025",
      category: "Work"
    },
    {
      id: 2,
      title: "Learn React Native",
      description: "Complete the React Native course and build a mobile app",
      progress: 40,
      deadline: "August 15, 2025",
      category: "Education"
    },
    {
      id: 3,
      title: "Run a 10k",
      description: "Train and complete a 10k race",
      progress: 60,
      deadline: "July 20, 2025",
      category: "Personal"
    },
    {
      id: 4,
      title: "Reduce Technical Debt",
      description: "Address and reduce technical debt in the main codebase",
      progress: 20,
      deadline: "September 1, 2025",
      category: "Work"
    }
  ];

  const completedGoals = [
    {
      id: 5,
      title: "Redesign Website",
      description: "Complete redesign of company website",
      progress: 100,
      completedDate: "April 15, 2025",
      category: "Work"
    }
  ];

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
                { id: "active", label: "Active Goals" },
                { id: "completed", label: "Completed" },
                { id: "all", label: "All Goals" }
              ]}
              actions={
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Goal
                </Button>
              }
            />
            
            <div className="flex-1 overflow-auto p-6">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="active" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
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
                              <span className="text-muted-foreground">Deadline:</span>
                              <span>{goal.deadline}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">Update</Button>
                              <Button size="sm">Check-in</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="completed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedGoals.length > 0 ? (
                      completedGoals.map(goal => (
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
                                <span className="text-muted-foreground">Completed:</span>
                                <span>{goal.completedDate}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-2 flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Target className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg mb-2">No completed goals yet</p>
                        <p className="text-sm">Complete some goals to see them here!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...goals, ...completedGoals].map(goal => (
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
                                {'completedDate' in goal ? 'Completed:' : 'Deadline:'}
                              </span>
                              <span>{'completedDate' in goal ? goal.completedDate : goal.deadline}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

