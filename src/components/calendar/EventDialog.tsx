import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: CalendarEvent | null;
  defaultDate?: Date;
};

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

export function EventDialog({ open, onOpenChange, event, defaultDate }: Props) {
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    }
  }, [open, event, defaultDate]);

  const isGoogle = !!event?.google_calendar_id;

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

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        all_day: allDay,
        start_time: startISO,
        end_time: endISO,
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

      // Push to Google if this event lives on a Google calendar (or new + connected)
      if (isGoogle || (isNew && (await hasGoogleConnection()))) {
        const action = isNew ? "create" : "update";
        const { error: pushErr } = await supabase.functions.invoke("google-calendar-push", {
          body: { action, event: { ...saved, add_meet: addMeet, meeting_url: meetingUrl } },
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

          <div className="flex items-center gap-2">
            <Checkbox id="allday" checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
            <Label htmlFor="allday" className="cursor-pointer">All day</Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start</Label>
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
              />
            </div>
            <div>
              <Label>End</Label>
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {isGoogle && (
            <p className="text-xs text-muted-foreground">
              This event is synced from Google Calendar. Changes will be pushed back.
            </p>
          )}
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

async function hasGoogleConnection() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase
    .from("google_calendar_connections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return (count ?? 0) > 0;
}
