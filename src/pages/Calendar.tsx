import React, { useEffect, useMemo, useRef, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { SyncedCalendarsCard } from "@/components/calendar/SyncedCalendarsCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { useCalendarSubscriptions } from "@/hooks/useCalendarSubscriptions";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import {
  MonthView,
  WeekView,
  DayView,
  ScheduleView,
} from "@/components/calendar/CalendarViews";
import { EventDialog } from "@/components/calendar/EventDialog";
import { GoogleCalendarPicker } from "@/components/calendar/GoogleCalendarPicker";

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
  const [activeTab, setActiveTab] = useState("schedule");
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [manageCalsOpen, setManageCalsOpen] = useState(false);

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
  const { connections, sync, isConnected } = useGoogleCalendar();
  const colorMap = subData?.colorMap ?? {};
  const subscriptions = subData?.subscriptions ?? [];
  const accounts = subData?.accounts ?? [];

  // Auto-sync on mount if any account is stale (>5 min) or never synced
  const autoSyncedRef = useRef(false);
  useEffect(() => {
    if (autoSyncedRef.current || !isConnected || connections.length === 0) return;
    const STALE_MS = 5 * 60 * 1000;
    const now = Date.now();
    const stale = connections.some((c) => {
      if (!c.last_sync_at) return true;
      return now - new Date(c.last_sync_at).getTime() > STALE_MS;
    });
    if (stale && !sync.isPending) {
      autoSyncedRef.current = true;
      sync.mutate();
    }
  }, [isConnected, connections, sync]);

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
              <div className="flex h-14 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden h-9 w-9" />
                  <h1 className="text-lg font-semibold tracking-tight">Calendar</h1>
                </div>
              </div>
            </header>

            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { value: "schedule", label: "Schedule" },
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
              actions={
                <TooltipProvider delayDuration={150}>
                  <div className="flex items-center gap-0.5">
                    <GoogleCalendarConnect compact />
                    {isConnected && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sync.mutate()}
                            disabled={sync.isPending}
                            className="h-8 w-8"
                          >
                            <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sync now</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={openNew} className="h-8 w-8">
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New event</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              }
            />

            <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
              {activeTab !== "schedule" && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => navigate(-1)} className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDate(new Date())}
                      className="min-w-[180px] justify-center text-sm font-medium"
                    >
                      {headerLabel}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => navigate(1)} className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {isLoading && (
                    <div className="text-xs text-muted-foreground">loading…</div>
                  )}
                </div>
              )}

              <Tabs value={activeTab} className="w-full">
                <TabsContent value="month" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <MonthView date={date} events={events} colorMap={colorMap} onSelectEvent={openEvent} onSelectDate={(d) => { setDate(d); setActiveTab("day"); }} />
                    </div>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {todayEvents.length > 0 ? (
                            <div className="space-y-2">
                              {todayEvents.map((event) => (
                                <button
                                  type="button"
                                  key={event.id}
                                  onClick={() => openEvent(event)}
                                  className="w-full text-left border rounded-md p-3 hover:bg-accent/40 transition-colors"
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
                              <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                              <p className="text-xs">No events today</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <SyncedCalendarsCard onManage={() => setManageCalsOpen(true)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="week" className="mt-0">
                  <WeekView date={date} events={events} colorMap={colorMap} onSelectEvent={openEvent} />
                </TabsContent>

                <TabsContent value="day" className="mt-0">
                  <DayView date={date} events={events} colorMap={colorMap} onSelectEvent={openEvent} />
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ScheduleView events={events} colorMap={colorMap} onSelectEvent={openEvent} />
                    </div>
                    <div className="space-y-4">
                      <SyncedCalendarsCard onManage={() => setManageCalsOpen(true)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                event={selectedEvent}
                defaultDate={date}
                subscriptions={subscriptions}
                accounts={accounts}
              />

              <GoogleCalendarPicker
                trigger={null}
                open={manageCalsOpen}
                onOpenChange={setManageCalsOpen}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
