
import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";

export default function Calendar() {
  const [activeTab, setActiveTab] = React.useState("month");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const events = [
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(),
      time: "10:00 AM - 11:00 AM",
      location: "Conference Room A"
    },
    {
      id: 2,
      title: "Project Review",
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: "2:00 PM - 3:30 PM",
      location: "Virtual"
    },
    {
      id: 3,
      title: "Client Presentation",
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      time: "11:00 AM - 12:30 PM",
      location: "Main Office"
    }
  ];
  
  const todayEvents = events.filter(event => 
    event.date.toDateString() === new Date().toDateString()
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden h-9 w-9" />
                  <h1 className="text-2xl font-bold gradient-heading">Calendar</h1>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </div>
            </header>
            
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
                { value: "day", label: "Day" },
                { value: "schedule", label: "Schedule" }
              ]}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <GoogleCalendarConnect compact />
                  <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Event
                  </Button>
                </div>
              }
            />
            
            <div className="flex-1 overflow-auto p-6">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="month" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Calendar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                          />
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <GoogleCalendarConnect />
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Today's Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {todayEvents.length > 0 ? (
                            <div className="space-y-4">
                              {todayEvents.map(event => (
                                <div key={event.id} className="border rounded-md p-3">
                                  <h3 className="font-medium">{event.title}</h3>
                                  <p className="text-sm text-muted-foreground">{event.time}</p>
                                  <p className="text-sm text-muted-foreground">{event.location}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                              <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                              <p>No events scheduled for today</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="week">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Week View</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Week view is under development
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="day">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Day View</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Day view is under development
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="schedule">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Schedule View</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Schedule view is under development
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
