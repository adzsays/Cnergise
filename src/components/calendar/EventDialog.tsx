import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { CalendarAccount, CalendarSubscription } from "@/hooks/useCalendarSubscriptions";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: CalendarEvent | null;
  defaultDate?: Date;
  subscriptions?: CalendarSubscription[];
  accounts?: CalendarAccount[];
};

const LOCAL_TARGET = "__local__";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toDateInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function EventDialog({ open, onOpenChange, event, defaultDate, subscriptions = [], accounts = [] }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isNew = !event;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [addMeet, setAddMeet] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [target, setTarget] = useState<string>(LOCAL_TARGET);
  const [recurrence, setRecurrence] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const enabledSubs = useMemo(() => {
    const list = subscriptions.filter((s) => s.enabled);
    // Drop the "primary" alias when an explicit calendar-id row exists for the same account
    const hasExplicitPrimaryByAccount = new Set<string>();
    for (const s of list) {
      if (s.is_primary && s.account_id && s.google_calendar_id !== "primary") {
        hasExplicitPrimaryByAccount.add(s.account_id);
      }
    }
    // Dedup by (account_id + google_calendar_id) and by visible label per account
    const seen = new Set<string>();
    const seenLabel = new Set<string>();
    return list.filter((s) => {
      if (s.google_calendar_id === "primary" && s.account_id && hasExplicitPrimaryByAccount.has(s.account_id)) return false;
      const k = `${s.account_id ?? ""}::${s.google_calendar_id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      const label = `${s.account_id ?? ""}::${(s.summary || s.google_calendar_id).trim().toLowerCase()}`;
      if (seenLabel.has(label)) return false;
      seenLabel.add(label);
      return true;
    });
  }, [subscriptions]);
  const accountById = useMemo(() => {
    const m = new Map<string, CalendarAccount>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  // Only reset form when the dialog opens or the event identity changes.
  // Do NOT depend on `enabledSubs` here — subscriptions can refetch in the background
  // and would otherwise clobber the user's selected target calendar mid-edit.
  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title ?? "");
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      const ad = !!event.all_day;
      setAllDay(ad);
      setStartStr(ad ? toDateInput(event.start_time) : toLocalInput(event.start_time));
      setEndStr(ad ? toDateInput(event.end_time) : toLocalInput(event.end_time));
      setMeetingUrl(event.meeting_url ?? null);
      setAddMeet(false);
      const r = (event as any).recurrence as string | null | undefined;
      const freqMatch = r?.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i);
      setRecurrence(freqMatch ? freqMatch[1].toLowerCase() : "none");
      if (event.google_calendar_id) {
        const sub = enabledSubs.find((s) => s.google_calendar_id === event.google_calendar_id);
        setTarget(sub?.id ?? LOCAL_TARGET);
      } else {
        setTarget(LOCAL_TARGET);
      }
    } else {
      const base = defaultDate ?? new Date();
      const start = new Date(base);
      start.setMinutes(0, 0, 0);
      if (start.getTime() < Date.now()) start.setHours(new Date().getHours() + 1, 0, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      setTitle("");
      setDescription("");
      setLocation("");
      setAllDay(false);
      setStartStr(toLocalInput(start.toISOString()));
      setEndStr(toLocalInput(end.toISOString()));
      setMeetingUrl(null);
      setAddMeet(false);
      setRecurrence("none");
      const primarySub = enabledSubs.find((s) => s.is_primary) ?? enabledSubs[0];
      setTarget(primarySub?.id ?? LOCAL_TARGET);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id]);

  // When subscriptions arrive AFTER the dialog opened for a new event and the
  // user hasn't actively changed the selection yet, auto-pick the primary calendar.
  useEffect(() => {
    if (!open || event) return;
    if (target !== LOCAL_TARGET) return;
    const primarySub = enabledSubs.find((s) => s.is_primary) ?? enabledSubs[0];
    if (primarySub) setTarget(primarySub.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledSubs.length, open]);

  const isGoogle = !!event?.google_calendar_id;
  const targetSub = enabledSubs.find((s) => s.id === target);
  const movedToDifferentCalendar =
    !isNew && isGoogle && targetSub && targetSub.google_calendar_id !== event?.google_calendar_id;

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const startISO = allDay ? new Date(`${startStr}T00:00:00`).toISOString() : new Date(startStr).toISOString();
      const endISO = allDay ? new Date(`${endStr}T00:00:00`).toISOString() : new Date(endStr).toISOString();

      const rrule = recurrence === "none" ? null : `FREQ=${recurrence.toUpperCase()}`;
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        all_day: allDay,
        start_time: startISO,
        end_time: endISO,
        recurrence: rrule,
      };

      let saved: any;
      if (isNew) {
        const { data, error } = await supabase
          .from("calendar_events")
          .insert({ ...payload, user_id: user.id, sync_source: "local" })
          .select()
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase
          .from("calendar_events")
          .update(payload)
          .eq("id", event!.id)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      }

      // Push to Google when user picked a Google calendar as target.
      // For existing Google events that are being moved to a different calendar,
      // we recreate on the new calendar; the previous remote event becomes orphaned
      // (we leave it in place to avoid unintended deletion).
      if (targetSub) {
        const accountId = targetSub.account_id ?? undefined;
        const targetCalId = targetSub.google_calendar_id;

        const isCreate = isNew || !event?.google_event_id || movedToDifferentCalendar;
        const action = isCreate ? "create" : "update";

        const { error: pushErr } = await supabase.functions.invoke("google-calendar-push", {
          body: {
            action,
            event: { ...saved, add_meet: addMeet, meeting_url: meetingUrl },
            account_id: accountId,
            target_calendar_id: targetCalId,
          },
        });
        if (pushErr) {
          toast({ title: "Saved locally", description: "Could not sync to Google: " + pushErr.message });
        }
      }

      toast({ title: isNew ? "Event created" : "Event updated" });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm("Delete this event?")) return;
    setDeleting(true);
    try {
      if (isGoogle && event.google_calendar_id) {
        await supabase.functions.invoke("google-calendar-push", {
          body: { action: "delete", event },
        });
      }
      const { error } = await supabase
        .from("calendar_events")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", event.id);
      if (error) throw error;
      toast({ title: "Event deleted" });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New event" : "Edit event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div>
            <Label>Save to calendar</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LOCAL_TARGET}>Cnergise (local only)</SelectItem>
                {enabledSubs.map((s) => {
                  const acct = s.account_id ? accountById.get(s.account_id) : null;
                  const acctEmail = acct?.google_email ?? "Google";
                  const rawLabel = s.summary || s.google_calendar_id;
                  // Primary calendars often have the account email as their summary,
                  // which would render "email · email". Show a friendlier label instead.
                  const isPrimaryLike =
                    s.is_primary ||
                    rawLabel.toLowerCase() === acctEmail.toLowerCase() ||
                    s.google_calendar_id.toLowerCase() === acctEmail.toLowerCase();
                  const label = isPrimaryLike ? "Primary" : rawLabel;
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.background_color ?? "#666" }}
                        />
                        {label} · {acctEmail}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {movedToDifferentCalendar && (
              <p className="mt-1 text-[11px] text-amber-600">
                Moving to a different calendar will create a new event there. The original remains in its previous calendar.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="allday" checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
            <Label htmlFor="allday" className="cursor-pointer">All day</Label>
          </div>

          <div>
            <Label>Repeat</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allDay ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start</Label>
                <Input type="date" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="date" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={startStr.slice(0, 10)}
                    onChange={(e) => setStartStr(`${e.target.value}T${startStr.slice(11) || "09:00"}`)}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    className="w-[110px]"
                    value={startStr.slice(11, 16)}
                    onChange={(e) => setStartStr(`${startStr.slice(0, 10) || toDateInput(new Date().toISOString())}T${e.target.value}`)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={endStr.slice(0, 10)}
                    onChange={(e) => setEndStr(`${e.target.value}T${endStr.slice(11) || "10:00"}`)}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    className="w-[110px]"
                    value={endStr.slice(11, 16)}
                    onChange={(e) => setEndStr(`${endStr.slice(0, 10) || toDateInput(new Date().toISOString())}T${e.target.value}`)}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="rounded-md border p-3 space-y-2">
            {meetingUrl ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Google Meet</p>
                  <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline truncate block"
                  >
                    {meetingUrl}
                  </a>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => { navigator.clipboard.writeText(meetingUrl); toast({ title: "Meet link copied" }); }}
                >
                  Copy
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="addmeet"
                  checked={addMeet}
                  onCheckedChange={(v) => setAddMeet(!!v)}
                  disabled={target === LOCAL_TARGET}
                />
                <Label htmlFor="addmeet" className="cursor-pointer text-sm">
                  Add Google Meet video conferencing
                </Label>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Meet links require saving the event to a Google calendar.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
