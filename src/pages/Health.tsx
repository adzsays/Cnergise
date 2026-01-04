
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Timer, 
  Droplets, 
  Moon, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function Health() {
  const [activeTab, setActiveTab] = React.useState("overview");
  
  const sleepData = [
    { day: 'Mon', hours: 7.5 },
    { day: 'Tue', hours: 6.8 },
    { day: 'Wed', hours: 7.2 },
    { day: 'Thu', hours: 8.0 },
    { day: 'Fri', hours: 6.5 },
    { day: 'Sat', hours: 7.8 },
    { day: 'Sun', hours: 8.5 }
  ];
  
  const steps = 8432;
  const stepsGoal = 10000;
  const stepsPercentage = Math.min(100, Math.round((steps / stepsGoal) * 100));
  
  const waterIntake = 1.8;
  const waterGoal = 2.5;
  const waterPercentage = Math.min(100, Math.round((waterIntake / waterGoal) * 100));
  
  const heartRate = {
    current: 72,
    resting: 65,
    previous: 74
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Health" />
            
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="activity" className="text-sm">Activity</TabsTrigger>
                    <TabsTrigger value="nutrition" className="text-sm">Nutrition</TabsTrigger>
                    <TabsTrigger value="sleep" className="text-sm">Sleep</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="overview" className="mt-0">
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
                          <div className="text-4xl font-bold mb-1">{heartRate.current}</div>
                          <div className="text-sm text-muted-foreground">bpm</div>
                        </div>
                        <div className="flex justify-between text-sm pt-2">
                          <div>
                            <div className="text-muted-foreground">Resting</div>
                            <div>{heartRate.resting} bpm</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground">Previous</div>
                            <div className="flex items-center">
                              {heartRate.previous} bpm 
                              {heartRate.current < heartRate.previous ? (
                                <ArrowDownRight className="h-4 w-4 text-green-500 ml-1" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-500 ml-1" />
                              )}
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
                          <div className="text-sm text-muted-foreground">steps today</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{stepsPercentage}%</span>
                          </div>
                          <Progress value={stepsPercentage} className="h-2" />
                          <div className="text-xs text-right text-muted-foreground">
                            Goal: {stepsGoal.toLocaleString()} steps
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-blue-400" />
                          Water
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold mb-1">{waterIntake}</div>
                          <div className="text-sm text-muted-foreground">liters</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{waterPercentage}%</span>
                          </div>
                          <Progress value={waterPercentage} className="h-2" />
                          <div className="text-xs text-right text-muted-foreground">
                            Goal: {waterGoal} liters
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-3">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Moon className="h-5 w-5 text-indigo-400" />
                          Sleep
                        </CardTitle>
                        <CardDescription>Last 7 days of sleep data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sleepData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="hours" 
                                stroke="#8884d8" 
                                activeDot={{ r: 8 }} 
                                strokeWidth={2} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Activity tracking features coming soon
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="nutrition">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Nutrition</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Nutrition tracking features coming soon
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="sleep">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Sleep Details</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Detailed sleep tracking features coming soon
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
