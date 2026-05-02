import React, { useMemo, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { useCalendarSubscriptions } from "@/hooks/useCalendarSubscriptions";
import {
  MonthView,
  WeekView,
  DayView,
  ScheduleView,
} from "@/components/calendar/CalendarViews";
import { EventDialog } from "@/components/calendar/EventDialog";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function Calendar() {
  const [activeTab, setActiveTab] = useState("month");
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const openEvent = (e: CalendarEvent) => { setSelectedEvent(e); setDialogOpen(true); };
  const openNew = () => { setSelectedEvent(null); setDialogOpen(true); };

  // Fetch a wide enough range to cover all views
  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59);
    return { rangeStart: start, rangeEnd: end };
  }, [date]);

  const { data: events = [], isLoading } = useCalendarEvents(rangeStart, rangeEnd);
  const { data: subData } = useCalendarSubscriptions();
  const colorMap = subData?.colorMap ?? {};
  const subscriptions = subData?.subscriptions ?? [];
  const accounts = subData?.accounts ?? [];

  const todayEvents = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    return events.filter(
      (e) => startOfDay(new Date(e.start_time)).getTime() === today,
    );
  }, [events]);

  const navigate = (dir: -1 | 1) => {
    if (activeTab === "day") setDate((d) => addDays(d, dir));
    else if (activeTab === "week") setDate((d) => addDays(d, dir * 7));
    else setDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const headerLabel = useMemo(() => {
    if (activeTab === "day")
      return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    if (activeTab === "week") {
      const ws = addDays(date, -date.getDay());
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString([], { month: "short", day: "numeric" })} – ${we.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return date.toLocaleDateString([], { month: "long", year: "numeric" });
  }, [activeTab, date]);

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
                { value: "schedule", label: "Schedule" },
              ]}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <GoogleCalendarConnect compact />
                  <Button variant="outline" size="sm" onClick={openNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Event
                  </Button>
                </div>
              }
            />

            <div className="flex-1 overflow-auto p-4 md:p-6">
              {activeTab !== "schedule" && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" onClick={() => navigate(-1)} className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDate(new Date())}>
                      Today
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => navigate(1)} className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {headerLabel}
                    {isLoading && " · loading…"}
                  </div>
                </div>
              )}

              <Tabs value={activeTab} className="w-full">
                <TabsContent value="month" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <MonthView date={date} events={events} onSelectEvent={openEvent} onSelectDate={(d) => { setDate(d); setActiveTab("day"); }} />
                    </div>
                    <div className="space-y-4">
                      <GoogleCalendarConnect />
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>Today's Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {todayEvents.length > 0 ? (
                            <div className="space-y-3">
                              {todayEvents.map((event) => (
                                <button
                                  type="button"
                                  key={event.id}
                                  onClick={() => openEvent(event)}
                                  className="w-full text-left border rounded-md p-3 hover:bg-accent/40"
                                >
                                  <h3 className="font-medium text-sm">{event.title}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {event.all_day
                                      ? "All day"
                                      : `${new Date(event.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${new Date(event.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                                  </p>
                                  {event.location && (
                                    <p className="text-xs text-muted-foreground">{event.location}</p>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                              <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                              <p className="text-sm">No events scheduled for today</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="week" className="mt-0">
                  <WeekView date={date} events={events} onSelectEvent={openEvent} />
                </TabsContent>

                <TabsContent value="day" className="mt-0">
                  <DayView date={date} events={events} onSelectEvent={openEvent} />
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                  <ScheduleView events={events} onSelectEvent={openEvent} />
                </TabsContent>
              </Tabs>

              <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                event={selectedEvent}
                defaultDate={date}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
