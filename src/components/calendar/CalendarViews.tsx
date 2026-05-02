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
  return events.filter((e) => {
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
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2 text-center">{d}</div>
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
                "min-h-[88px] cursor-pointer border-b border-r p-1.5 text-left align-top transition-colors hover:bg-accent/40",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday && "bg-primary text-primary-foreground font-semibold",
                )}
              >
                {d.getDate()}
              </div>
              <div className="space-y-1">
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
    <div className="grid grid-cols-7 gap-2">
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
  );
}

export function DayView({ date, events, onSelectEvent, colorMap }: ViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = eventsOnDate(events, date);

  return (
    <div className="rounded-md border bg-card">
      <div className="border-b px-3 py-2 text-sm font-medium">
        {date.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
      <div className="divide-y">
        {hours.map((h) => {
          const slotStart = new Date(date);
          slotStart.setHours(h, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(h + 1);
          const inSlot = dayEvents.filter((e) => {
            const s = new Date(e.start_time).getTime();
            const en = new Date(e.end_time).getTime();
            return s < slotEnd.getTime() && en > slotStart.getTime();
          });
          return (
            <div key={h} className="grid grid-cols-[60px_1fr] min-h-[44px]">
              <div className="border-r px-2 py-1 text-xs text-muted-foreground">
                {slotStart.toLocaleTimeString([], { hour: "numeric" })}
              </div>
              <div className="space-y-1 p-1">
                {inSlot.map((ev) => (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={() => onSelectEvent?.(ev)}
                    style={eventStyle(ev, colorMap)}
                    className="block w-full text-left rounded bg-primary/10 px-2 py-1 text-xs text-primary hover:opacity-80"
                  >
                    <div className="font-medium">{ev.title}</div>
                    <div className="text-[10px] opacity-80">
                      {fmtTime(new Date(ev.start_time))} – {fmtTime(new Date(ev.end_time))}
                      {ev.location ? ` · ${ev.location}` : ""}
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

export function ScheduleView({ events, onSelectEvent, colorMap }: { events: CalendarEvent[]; onSelectEvent?: (e: CalendarEvent) => void; colorMap?: Record<string, string> }) {
  const grouped = useMemo(() => {
    const todayStart = startOfDay(new Date()).getTime();
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const endMs = new Date(e.end_time).getTime();
      // Only include events that haven't ended yet (today or future)
      if (endMs < todayStart) continue;
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
                    className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-accent/40"
                  >
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c ?? "hsl(var(--primary))" }}
                    />
                    <div className="w-24 shrink-0 text-xs text-muted-foreground">
                      {ev.all_day
                        ? "All day"
                        : `${fmtTime(new Date(ev.start_time))} – ${fmtTime(new Date(ev.end_time))}`}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ev.title}</p>
                      {ev.location && (
                        <p className="text-xs text-muted-foreground truncate">{ev.location}</p>
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
