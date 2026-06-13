import React, { useEffect, useMemo, useRef, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Pencil, Video, CalendarCheck } from "lucide-react";
import { BookingsManager } from "@/pages/Bookings";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { SyncedCalendarsCard } from "@/components/calendar/SyncedCalendarsCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { GoogleReauthBanner } from "@/components/calendar/GoogleReauthBanner";

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
  const initialMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "bookings" ? "bookings" : "calendar";
  const [mode, setMode] = useState<"calendar" | "bookings">(initialMode);
  const [view, setView] = useState<"schedule" | "day" | "week" | "month">("schedule");
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date | undefined>(undefined);
  const [dayDetailEvent, setDayDetailEvent] = useState<CalendarEvent | null>(null);
  const [manageCalsOpen, setManageCalsOpen] = useState(false);

  const openEvent = (e: CalendarEvent) => { setSelectedEvent(e); setDialogDefaultDate(undefined); setDialogOpen(true); };
  const openNew = (d?: Date) => { setSelectedEvent(null); setDialogDefaultDate(d ?? date); setDialogOpen(true); };

  const { rangeStart, rangeEnd } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = view === "schedule"
      ? today
      : new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = view === "schedule"
      ? addDays(today, 90)
      : new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59);
    return { rangeStart: start, rangeEnd: end };
  }, [date, view]);

  const { data: events = [], isLoading } = useCalendarEvents(rangeStart, rangeEnd);
  const { data: subData } = useCalendarSubscriptions();
  const { connections, sync, isConnected } = useGoogleCalendar();
  const colorMap = subData?.colorMap ?? {};
  const subscriptions = subData?.subscriptions ?? [];
  const accounts = subData?.accounts ?? [];

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
    return events.filter((e) => startOfDay(new Date(e.start_time)).getTime() === today);
  }, [events]);

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setDate((d) => addDays(d, dir));
    else if (view === "week") setDate((d) => addDays(d, dir * 7));
    else if (view === "month") setDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const headerLabel = useMemo(() => {
    if (view === "day")
      return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    if (view === "week") {
      const ws = addDays(date, -date.getDay());
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString([], { month: "short", day: "numeric" })} – ${we.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (view === "month")
      return date.toLocaleDateString([], { month: "long", year: "numeric" });
    return "";
  }, [view, date]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center justify-between gap-2 px-3 md:px-6">
                <div className="flex items-center gap-2 min-w-0">
                  <SidebarTrigger className="md:hidden h-9 w-9" />
                  <h1 className="text-lg font-semibold tracking-tight truncate">{mode === "bookings" ? "Bookings" : "Calendar"}</h1>
                </div>
                <div className="flex items-center gap-1.5">
                  <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as any)} className="border rounded-md">
                    <ToggleGroupItem value="calendar" className="h-8 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <CalendarIcon className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">Calendar</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bookings" className="h-8 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <CalendarCheck className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">Bookings</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {mode === "calendar" && (
                    <>
                      <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="schedule">Schedule</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <GoogleCalendarConnect compact />
                      <Button variant="ghost" size="icon" onClick={() => openNew()} className="h-8 w-8" title="New event">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
              {mode === "bookings" ? (
                <BookingsManager showHeading={false} />
              ) : (
              <>
              <GoogleReauthBanner />
              {view !== "schedule" && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => navigate(-1)} className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDate(new Date())}
                      className="min-w-[160px] justify-center text-sm font-medium"
                    >
                      {headerLabel}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => navigate(1)} className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {isLoading && <div className="text-xs text-muted-foreground">loading…</div>}
                </div>
              )}

              <Tabs value={view} className="w-full">
                <TabsContent value="month" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <MonthView date={date} events={events} colorMap={colorMap} onSelectEvent={openEvent} onSelectDate={(d) => setDate(d)} />
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
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${dayDetailEvent ? "flex flex-col-reverse md:grid" : ""}`}>
                    <DayView
                      date={date}
                      events={events}
                      colorMap={colorMap}
                      selectedEventId={dayDetailEvent?.id ?? null}
                      onSelectEvent={(e) => setDayDetailEvent(e)}
                      onSlotClick={(slot) => openNew(slot)}
                    />
                    <div className={dayDetailEvent ? "sticky top-14 z-10 md:static bg-background" : ""}>
                      {dayDetailEvent ? (
                        <Card>
                          <CardHeader className="pb-2 flex-row items-start justify-between gap-2 space-y-0">
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate">{dayDetailEvent.title}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {dayDetailEvent.all_day
                                  ? "All day"
                                  : `${new Date(dayDetailEvent.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${new Date(dayDetailEvent.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openEvent(dayDetailEvent)} className="h-8">
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {dayDetailEvent.location && (
                              <p className="flex items-start gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{dayDetailEvent.location}</span>
                              </p>
                            )}
                            {dayDetailEvent.meeting_url && (
                              <a
                                href={dayDetailEvent.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline"
                              >
                                <Video className="h-4 w-4" /> Join meeting
                              </a>
                            )}
                            {dayDetailEvent.description && (
                              <p className="whitespace-pre-wrap text-foreground/90">{dayDetailEvent.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground h-full flex flex-col items-center justify-center">
                          <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                          <p>Select an event to see details</p>
                          <p className="text-xs mt-1">or click an empty slot to create one</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <ScheduleView
                      events={events}
                      colorMap={colorMap}
                      selectedEventId={dayDetailEvent?.id ?? null}
                      onSelectEvent={(e) => setDayDetailEvent(e)}
                    />
                    <div className="space-y-4">
                      {dayDetailEvent ? (
                        <Card>
                          <CardHeader className="pb-2 flex-row items-start justify-between gap-2 space-y-0">
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate">{dayDetailEvent.title}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(dayDetailEvent.start_time).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                {!dayDetailEvent.all_day && (
                                  <> · {new Date(dayDetailEvent.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(dayDetailEvent.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>
                                )}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openEvent(dayDetailEvent)} className="h-8">
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {dayDetailEvent.location && (
                              <p className="flex items-start gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{dayDetailEvent.location}</span>
                              </p>
                            )}
                            {dayDetailEvent.meeting_url && (
                              <a
                                href={dayDetailEvent.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline"
                              >
                                <Video className="h-4 w-4" /> Join meeting
                              </a>
                            )}
                            {dayDetailEvent.description && (
                              <p className="whitespace-pre-wrap text-foreground/90">{dayDetailEvent.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
                          <CalendarIcon className="h-8 w-8 mb-2 opacity-20 mx-auto" />
                          <p>Select an event to see details</p>
                        </div>
                      )}
                      <SyncedCalendarsCard onManage={() => setManageCalsOpen(true)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                event={selectedEvent}
                defaultDate={dialogDefaultDate ?? date}
                subscriptions={subscriptions}
                accounts={accounts}
              />

              <GoogleCalendarPicker
                trigger={null}
                open={manageCalsOpen}
                onOpenChange={setManageCalsOpen}
              />
              </>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}