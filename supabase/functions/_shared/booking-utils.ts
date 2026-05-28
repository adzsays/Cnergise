// Shared utilities for the booking system.

export type EventType = {
  id: string;
  user_id: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_advance_days: number;
  timezone: string;
};

export type AvailabilityRule = { day_of_week: number; start_time: string; end_time: string };
export type DateOverride = { date: string; is_unavailable: boolean; start_time: string | null; end_time: string | null };
export type BusyInterval = { start: number; end: number }; // ms epoch
export type CalendarBusySource = {
  start_time: string;
  end_time: string;
  all_day?: boolean | null;
  recurrence?: string | null;
  google_event_id?: string | null;
};

// Convert "YYYY-MM-DD" + "HH:MM[:SS]" interpreted in `tz` to UTC ms epoch.
// Uses Intl.DateTimeFormat to derive the offset for that wall-clock instant.
export function wallTimeInZoneToUtc(dateISO: string, time: string, tz: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm, ss = "0"] = time.split(":");
  const naiveUtc = Date.UTC(y, m - 1, d, Number(hh), Number(mm), Number(ss));
  // Find offset for that instant
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(naiveUtc));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offset = asUtc - naiveUtc; // ms
  return naiveUtc - offset;
}

// Get day_of_week (0=Sun..6=Sat) for a UTC instant interpreted in `tz`.
export function dayOfWeekInZone(epoch: number, tz: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date(epoch));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

// Iterate calendar dates between fromISO and toISO inclusive, in host tz.
export function eachDateInZone(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  for (let t = start; t <= end; t += 86_400_000) {
    const dt = new Date(t);
    const iso = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    out.push(iso);
  }
  return out;
}

// Compute available slots for an event type within [fromISO, toISO].
export function computeSlots(args: {
  eventType: EventType;
  rules: AvailabilityRule[];
  overrides: DateOverride[];
  busy: BusyInterval[];
  fromISO: string;
  toISO: string;
}): string[] {
  const { eventType: et, rules, overrides, busy, fromISO, toISO } = args;
  const stepMs = et.duration_minutes * 60_000;
  const bufBefore = et.buffer_before_minutes * 60_000;
  const bufAfter = et.buffer_after_minutes * 60_000;
  const earliest = Date.now() + et.min_notice_minutes * 60_000;
  const latest = Date.now() + et.max_advance_days * 86_400_000;

  const overridesByDate = new Map(overrides.map((o) => [o.date, o]));
  const slots: string[] = [];

  for (const date of eachDateInZone(fromISO, toISO)) {
    const override = overridesByDate.get(date);
    let windows: Array<{ start: string; end: string }> = [];
    if (override) {
      if (override.is_unavailable) continue;
      if (override.start_time && override.end_time) {
        windows = [{ start: override.start_time, end: override.end_time }];
      }
    }
    if (windows.length === 0) {
      // Determine day_of_week for this date at noon in host tz (avoids DST midnight quirks)
      const noonUtc = wallTimeInZoneToUtc(date, "12:00", et.timezone);
      const dow = dayOfWeekInZone(noonUtc, et.timezone);
      windows = rules.filter((r) => r.day_of_week === dow).map((r) => ({ start: r.start_time, end: r.end_time }));
    }
    for (const w of windows) {
      const winStart = wallTimeInZoneToUtc(date, w.start, et.timezone);
      const winEnd = wallTimeInZoneToUtc(date, w.end, et.timezone);
      for (let s = winStart; s + stepMs <= winEnd; s += stepMs) {
        const e = s + stepMs;
        if (s < earliest || s > latest) continue;
        const checkStart = s - bufBefore;
        const checkEnd = e + bufAfter;
        const conflict = busy.some((b) => b.start < checkEnd && b.end > checkStart);
        if (!conflict) slots.push(new Date(s).toISOString());
      }
    }
  }
  return slots;
}

function normalizeBusyInterval(e: CalendarBusySource, startMs = new Date(e.start_time).getTime()): BusyInterval | null {
  const rawEndMs = new Date(e.end_time).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(rawEndMs) || rawEndMs <= startMs) return null;

  // Recurring timed events should block the event duration, not every day until the recurrence end.
  // Older rows could contain an end date months later; cap those to the same-day end time.
  const likelyExpandedGoogleOccurrence = !!e.google_event_id && String(e.google_event_id).includes("_");
  const isRecurringTimed = !e.all_day && (!!e.recurrence || likelyExpandedGoogleOccurrence);
  if (isRecurringTimed && rawEndMs - startMs > 18 * 60 * 60 * 1000) {
    const start = new Date(startMs);
    const rawEnd = new Date(rawEndMs);
    const end = new Date(startMs);
    end.setUTCHours(rawEnd.getUTCHours(), rawEnd.getUTCMinutes(), rawEnd.getUTCSeconds(), rawEnd.getUTCMilliseconds());
    if (end.getTime() <= start.getTime()) end.setUTCDate(end.getUTCDate() + 1);
    if (end.getTime() > start.getTime()) return { start: startMs, end: end.getTime() };
  }

  return { start: startMs, end: rawEndMs };
}

export function calendarEventsToBusy(events: CalendarBusySource[], rangeStartISO: string, rangeEndISO: string): BusyInterval[] {
  const rangeStart = new Date(rangeStartISO).getTime();
  const rangeEnd = new Date(rangeEndISO).getTime();
  const busy: BusyInterval[] = [];

  for (const e of events) {
    const freq = e.recurrence?.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i)?.[1]?.toUpperCase();
    const base = normalizeBusyInterval(e);
    if (!base) continue;
    const duration = base.end - base.start;

    if (!freq || e.google_event_id) {
      if (base.start < rangeEnd && base.end > rangeStart) busy.push(base);
      continue;
    }

    const cursor = new Date(base.start);
    const step = (d: Date) => {
      if (freq === "DAILY") d.setUTCDate(d.getUTCDate() + 1);
      else if (freq === "WEEKLY") d.setUTCDate(d.getUTCDate() + 7);
      else if (freq === "MONTHLY") d.setUTCMonth(d.getUTCMonth() + 1);
      else if (freq === "YEARLY") d.setUTCFullYear(d.getUTCFullYear() + 1);
    };
    let safety = 0;
    while (cursor.getTime() + duration < rangeStart && safety < 1200) {
      step(cursor);
      safety++;
    }
    while (cursor.getTime() < rangeEnd && safety < 1600) {
      const start = cursor.getTime();
      const end = start + duration;
      if (start < rangeEnd && end > rangeStart) busy.push({ start, end });
      step(cursor);
      safety++;
    }
  }

  return busy;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

export async function getValidAccessToken(admin: any, userId: string, preferredCalendarId?: string | null): Promise<{ accessToken: string; calendarId: string; connId: string } | null> {
  // Determine the user's chosen booking calendar; route to the account that owns it
  // so the calendar invite is sent from the right mailbox.
  const { data: prof } = await admin
    .from("profiles")
    .select("booking_calendar_id")
    .eq("id", userId)
    .maybeSingle();
  const chosenCalId: string | null = preferredCalendarId || prof?.booking_calendar_id || null;

  let preferredAccountId: string | null = null;
  if (chosenCalId) {
    const { data: sub } = await admin
      .from("google_calendar_subscriptions")
      .select("account_id")
      .eq("user_id", userId)
      .eq("google_calendar_id", chosenCalId)
      .eq("enabled", true)
      .maybeSingle();
    if (sub?.account_id) preferredAccountId = sub.account_id;
  }

  const { data: conns } = await admin
    .from("google_calendar_connections_decrypted")
    .select("id, access_token, refresh_token, token_expires_at, primary_calendar_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (!conns || conns.length === 0) return null;

  const conn = (preferredAccountId && conns.find((c: any) => c.id === preferredAccountId)) || conns[0];
  let accessToken = conn.access_token as string;
  if (!conn.token_expires_at || new Date(conn.token_expires_at).getTime() < Date.now() + 60_000) {
    if (!conn.refresh_token) return null;
    const r = await refreshGoogleAccessToken(conn.refresh_token);
    if (!r.ok || !r.json?.access_token) return null;
    accessToken = r.json.access_token;
    const newExpiry = new Date(Date.now() + (r.json.expires_in ?? 3600) * 1000).toISOString();
    await admin.from("google_calendar_connections")
      .update({ access_token: accessToken, token_expires_at: newExpiry })
      .eq("id", conn.id);
  }
  return { accessToken, calendarId: chosenCalId || conn.primary_calendar_id || "primary", connId: conn.id };
}
