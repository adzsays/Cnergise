import React, { useMemo } from "react";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { cn } from "@/lib/utils";

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
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  return addDays(x, -day);
}
function startOfMonthGrid(d: Date) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return startOfWeek(first);
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function eventsOnDate(events: CalendarEvent[], date: Date) {
  const start = startOfDay(date).getTime();
  const end = addDays(date, 1).getTime();
  // The cell represents this calendar date (year/month/day) in local time.
  const cellY = date.getFullYear(), cellM = date.getMonth(), cellD = date.getDate();
  const cellNum = cellY * 10000 + cellM * 100 + cellD;
  return events.filter((e) => {
    if (e.all_day) {
      // Google all-day: dates are UTC midnights and end is *exclusive*.
      // Compare by calendar date so a tz offset doesn't bleed into the next cell.
      const s = new Date(e.start_time);
      const en = new Date(e.end_time);
      const sNum = s.getUTCFullYear() * 10000 + s.getUTCMonth() * 100 + s.getUTCDate();
      // Last inclusive day = end - 1 day
      const lastMs = en.getTime() - 24 * 3600 * 1000;
      const last = new Date(lastMs);
      const eNum = last.getUTCFullYear() * 10000 + last.getUTCMonth() * 100 + last.getUTCDate();
      return cellNum >= sNum && cellNum <= eNum;
    }
    const s = new Date(e.start_time).getTime();
    const en = new Date(e.end_time).getTime();
    return s < end && en > start;
  });
}

type ViewProps = {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent?: (e: CalendarEvent) => void;
  onSelectDate?: (d: Date) => void;
  colorMap?: Record<string, string>;
};

function eventColor(ev: CalendarEvent, colorMap?: Record<string, string>): string | undefined {
  if (ev.google_calendar_id && colorMap?.[ev.google_calendar_id]) return colorMap[ev.google_calendar_id];
  return undefined;
}

function eventStyle(ev: CalendarEvent, colorMap?: Record<string, string>): React.CSSProperties {
  const c = eventColor(ev, colorMap);
  if (!c) return {};
  // background tinted, text uses the same color for contrast
  return { backgroundColor: `${c}22`, color: c, borderLeft: `3px solid ${c}` };
}

export function MonthView({ date, events, onSelectDate, onSelectEvent, colorMap }: ViewProps) {
  const gridStart = useMemo(() => startOfMonthGrid(date), [date]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );
  const today = startOfDay(new Date()).getTime();
  const month = date.getMonth();

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-[10px] sm:text-xs font-medium text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="p-1 sm:p-2 text-center">
            <span className="sm:hidden">{d}</span>
            <span className="hidden sm:inline">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const inMonth = d.getMonth() === month;
          const isToday = startOfDay(d).getTime() === today;
          const all = eventsOnDate(events, d);
          const dayEvents = all.slice(0, 3);
          const more = all.length - dayEvents.length;
          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDate?.(d)}
              className={cn(
                "min-h-[60px] sm:min-h-[88px] cursor-pointer border-b border-r p-1 sm:p-1.5 text-left align-top transition-colors hover:bg-accent/40 overflow-hidden",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "mb-0.5 sm:mb-1 inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs",
                  isToday && "bg-primary text-primary-foreground font-semibold",
                )}
              >
                {d.getDate()}
              </div>
              <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                {dayEvents.map((ev) => (
                  <button
                    type="button"
                    key={ev.id}
                    title={ev.title}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent?.(ev); }}
                    style={eventStyle(ev, colorMap)}
                    className="block w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-[11px] text-primary hover:opacity-80"
                  >
                    {ev.all_day ? "" : `${fmtTime(new Date(ev.start_time))} `}
                    {ev.title}
                  </button>
                ))}
                {more > 0 && (
                  <div className="text-[11px] text-muted-foreground">+{more} more</div>
                )}
              </div>
              {/* Mobile: just show dots for events */}
              <div className="sm:hidden flex flex-wrap gap-0.5 mt-1">
                {all.slice(0, 4).map((ev) => {
                  const c = eventColor(ev, colorMap);
                  return (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      style={c ? { backgroundColor: c } : undefined}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WeekView({ date, events, onSelectEvent, colorMap }: ViewProps) {
  const weekStart = useMemo(() => startOfWeek(date), [date]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const today = startOfDay(new Date()).getTime();

  return (
    <>
      {/* Mobile: vertical stack of days */}
      <div className="space-y-2 md:hidden">
        {days.map((d) => {
          const isToday = startOfDay(d).getTime() === today;
          const dayEvents = eventsOnDate(events, d);
          return (
            <div key={d.toISOString()} className="rounded-md border bg-card">
              <div
                className={cn(
                  "flex items-center justify-between border-b px-3 py-1.5 text-xs",
                  isToday && "bg-primary/10 text-primary font-semibold",
                )}
              >
                <span>{d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="text-muted-foreground">{dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}</span>
              </div>
              {dayEvents.length > 0 && (
                <div className="space-y-1 p-2">
                  {dayEvents.map((ev) => (
                    <button
                      type="button"
                      key={ev.id}
                      onClick={() => onSelectEvent?.(ev)}
                      style={eventStyle(ev, colorMap)}
                      className="block w-full text-left rounded bg-primary/10 px-2 py-1 text-xs text-primary hover:opacity-80"
                    >
                      <div className="font-medium truncate">{ev.title}</div>
                      {!ev.all_day && (
                        <div className="text-[10px] opacity-80">
                          {fmtTime(new Date(ev.start_time))} – {fmtTime(new Date(ev.end_time))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {days.map((d) => {
          const isToday = startOfDay(d).getTime() === today;
          const dayEvents = eventsOnDate(events, d);
          return (
            <div key={d.toISOString()} className="rounded-md border bg-card">
              <div
                className={cn(
                  "border-b px-2 py-1.5 text-center text-xs",
                  isToday && "bg-primary/10 text-primary font-semibold",
                )}
              >
                <div>{d.toLocaleDateString([], { weekday: "short" })}</div>
                <div className="text-base font-medium text-foreground">{d.getDate()}</div>
              </div>
              <div className="space-y-1 p-1.5 min-h-[200px]">
                {dayEvents.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center pt-4">—</p>
                ) : (
                  dayEvents.map((ev) => (
                    <button
                      type="button"
                      key={ev.id}
                      onClick={() => onSelectEvent?.(ev)}
                      style={eventStyle(ev, colorMap)}
                      className="block w-full text-left rounded bg-primary/10 px-1.5 py-1 text-[11px] text-primary hover:opacity-80"
                    >
                      <div className="font-medium truncate">{ev.title}</div>
                      {!ev.all_day && (
                        <div className="text-[10px] opacity-80">
                          {fmtTime(new Date(ev.start_time))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function DayView({
  date,
  events,
  onSelectEvent,
  onSlotClick,
  selectedEventId,
  colorMap,
}: ViewProps & {
  onSlotClick?: (slotStart: Date) => void;
  selectedEventId?: string | null;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = eventsOnDate(events, date);
  const allDayEvents = dayEvents.filter((e) => e.all_day);
  const timedEvents = dayEvents.filter((e) => !e.all_day);

  return (
    <div className="rounded-md border bg-card">
      <div className="border-b px-3 py-1.5 text-xs font-medium">
        {date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
      </div>
      {allDayEvents.length > 0 && (
        <div className="border-b bg-muted/20 px-2 py-1.5 space-y-1">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">All day</div>
          {allDayEvents.map((ev) => (
            <button
              type="button"
              key={ev.id}
              onClick={() => onSelectEvent?.(ev)}
              style={eventStyle(ev, colorMap)}
              className={cn(
                "block w-full text-left rounded bg-primary/10 px-2 py-0.5 text-[11px] text-primary hover:opacity-80",
                selectedEventId === ev.id && "ring-2 ring-primary",
              )}
            >
              <div className="font-medium truncate">{ev.title}</div>
            </button>
          ))}
        </div>
      )}
      <div className="divide-y max-h-[70vh] overflow-y-auto">
        {hours.map((h) => {
          const slotStart = new Date(date);
          slotStart.setHours(h, 0, 0, 0);
          const inSlot = timedEvents.filter((e) => {
            const s = new Date(e.start_time);
            return s.getHours() === h && s.toDateString() === date.toDateString();
          });
          return (
            <div
              key={h}
              onClick={() => inSlot.length === 0 && onSlotClick?.(slotStart)}
              className={cn(
                "grid grid-cols-[40px_1fr] min-h-[28px]",
                inSlot.length === 0 && onSlotClick && "cursor-pointer hover:bg-accent/30",
              )}
            >
              <div className="border-r px-1 py-0.5 text-[9px] text-muted-foreground">
                {slotStart.toLocaleTimeString([], { hour: "numeric" })}
              </div>
              <div className="space-y-0.5 p-0.5">
                {inSlot.map((ev) => (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent?.(ev); }}
                    style={eventStyle(ev, colorMap)}
                    className={cn(
                      "block w-full text-left rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary hover:opacity-80",
                      selectedEventId === ev.id && "ring-2 ring-primary",
                    )}
                  >
                    <div className="font-medium truncate">{ev.title}</div>
                    <div className="text-[9px] opacity-80 truncate">
                      {fmtTime(new Date(ev.start_time))} – {fmtTime(new Date(ev.end_time))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleView({ events, onSelectEvent, colorMap, selectedEventId }: { events: CalendarEvent[]; onSelectEvent?: (e: CalendarEvent) => void; colorMap?: Record<string, string>; selectedEventId?: string | null }) {
  const grouped = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const endMs = new Date(e.end_time).getTime();
      if (endMs < now) continue;
      const k = startOfDay(new Date(e.start_time)).toISOString();
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    const out = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [, items] of out) {
      items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
    return out;
  }, [events]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
        No upcoming events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([day, items]) => (
        <div key={day} className="rounded-md border bg-card">
          <div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">
            {new Date(day).toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
          <ul className="divide-y">
            {items.map((ev) => {
              const c = eventColor(ev, colorMap);
              const isSelected = selectedEventId === ev.id;
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent?.(ev)}
                    className={cn(
                      "flex w-full items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 text-left text-sm hover:bg-accent/40 transition-colors",
                      isSelected && "bg-accent/60",
                    )}
                  >
  const grouped = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const endMs = new Date(e.end_time).getTime();
      // Only include events that haven't ended yet
      if (endMs < now) continue;
      const k = startOfDay(new Date(e.start_time)).toISOString();
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    // Sort days ascending and events within day by start time
    const out = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [, items] of out) {
      items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
    return out;
  }, [events]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
        No upcoming events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([day, items]) => (
        <div key={day} className="rounded-md border bg-card">
          <div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">
            {new Date(day).toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
          <ul className="divide-y">
            {items.map((ev) => {
              const c = eventColor(ev, colorMap);
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent?.(ev)}
                    className="flex w-full items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 text-left text-sm hover:bg-accent/40"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c ?? "hsl(var(--primary))" }}
                    />
                    <div className="w-14 sm:w-24 shrink-0 text-[10px] sm:text-xs text-muted-foreground leading-tight">
                      {ev.all_day
                        ? "All day"
                        : (
                          <>
                            <div>{fmtTime(new Date(ev.start_time))}</div>
                            <div className="hidden sm:inline">– {fmtTime(new Date(ev.end_time))}</div>
                          </>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs sm:text-sm">{ev.title}</p>
                      {ev.location && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{ev.location}</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
