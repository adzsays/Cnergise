import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Copy, Link as LinkIcon, Pencil, Plus, Trash2, Video, MapPin, Phone, Globe } from "lucide-react";
import {
  useEventTypes,
  useUpsertEventType,
  useDeleteEventType,
  useAvailability,
  useReplaceAvailability,
  useBookings,
  useUserHandle,
  type BookingEventType,
  type AvailabilityRule,
} from "@/hooks/useBookings";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { HandleSetupCard } from "@/components/chat/HandleSetupCard";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TZ_OPTIONS = ["Europe/London", "Europe/Berlin", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "UTC"];

const LOCATION_ICON = {
  google_meet: Video,
  in_person: MapPin,
  phone: Phone,
  custom: Globe,
} as const;

export default function Bookings() {
  const { data: handle } = useUserHandle();
  const { data: eventTypes = [] } = useEventTypes();
  const { data: bookings = [] } = useBookings();
  const upsert = useUpsertEventType();
  const del = useDeleteEventType();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<BookingEventType> | null>(null);
  const [availOpenId, setAvailOpenId] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const publicHostLink = handle ? `${baseUrl}/book/${handle}` : null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold">Bookings</h1>
                <p className="text-sm text-muted-foreground">Share a link so people can book time on your calendar.</p>
              </div>
            </div>

            {!handle && (
              <Card>
                <CardContent className="p-4 text-sm">
                  You need a public handle before sharing a booking link.{" "}
                  <Link to="/chat" className="underline">Set up your @handle</Link>.
                </CardContent>
              </Card>
            )}

            {publicHostLink && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your public booking page</CardTitle>
                  <CardDescription>Share this link with anyone to let them pick an event type and book.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Input readOnly value={publicHostLink} className="font-mono text-xs" />
                  <Button variant="outline" onClick={() => copy(publicHostLink)} className="gap-2">
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                  <Button asChild className="gap-2">
                    <a href={publicHostLink} target="_blank" rel="noreferrer"><LinkIcon className="h-4 w-4" /> Open</a>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Event types</h2>
              <Button
                onClick={() => setEditing({
                  slug: "",
                  title: "",
                  duration_minutes: 30,
                  location_type: "google_meet",
                  timezone: "Europe/London",
                  buffer_before_minutes: 0,
                  buffer_after_minutes: 0,
                  min_notice_minutes: 60,
                  max_advance_days: 60,
                  is_active: true,
                })}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> New event type
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {eventTypes.map((et) => {
                const Icon = LOCATION_ICON[et.location_type];
                const link = handle ? `${baseUrl}/book/${handle}/${et.slug}` : null;
                return (
                  <Card key={et.id} className="overflow-hidden">
                    <div className="h-1" style={{ background: et.color || "hsl(var(--primary))" }} />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {et.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {et.duration_minutes} min · {et.location_type.replace("_", " ")} · {et.timezone}
                          </div>
                        </div>
                        {!et.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      {et.description && <p className="text-sm text-muted-foreground line-clamp-2">{et.description}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setEditing(et)} className="gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAvailOpenId(et.id)}>
                          Availability
                        </Button>
                        {link && (
                          <Button size="sm" variant="outline" onClick={() => copy(link)} className="gap-1">
                            <Copy className="h-3 w-3" /> Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive ml-auto"
                          onClick={() => { if (confirm("Delete this event type?")) del.mutate(et.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {eventTypes.length === 0 && (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">No event types yet. Create one to get started.</CardContent></Card>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Upcoming bookings</h2>
              <Card>
                <CardContent className="p-0">
                  {bookings.filter((b) => b.status === "confirmed" && new Date(b.start_time) > new Date()).length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No upcoming bookings.</div>
                  ) : (
                    <div className="divide-y">
                      {bookings.filter((b) => b.status === "confirmed" && new Date(b.start_time) > new Date()).map((b) => (
                        <div key={b.id} className="p-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                          <div>
                            <div className="font-medium">{b.invitee_name} <span className="text-muted-foreground font-normal">· {b.invitee_email}</span></div>
                            <div className="text-xs text-muted-foreground">{new Date(b.start_time).toLocaleString()} — {new Date(b.end_time).toLocaleTimeString()}</div>
                            {b.invitee_notes && <div className="text-xs mt-1">{b.invitee_notes}</div>}
                          </div>
                          {b.meet_link && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={b.meet_link} target="_blank" rel="noreferrer">Join meeting</a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {editing && (
        <EventTypeDialog
          value={editing}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            upsert.mutate(v, { onSuccess: () => setEditing(null) });
          }}
        />
      )}
      {availOpenId && (
        <AvailabilityDialog eventTypeId={availOpenId} onClose={() => setAvailOpenId(null)} />
      )}
    </SidebarProvider>
  );
}

function EventTypeDialog({
  value, onClose, onSave,
}: { value: Partial<BookingEventType>; onClose: () => void; onSave: (v: any) => void }) {
  const [form, setForm] = useState<Partial<BookingEventType>>(value);
  const update = <K extends keyof BookingEventType>(k: K, v: BookingEventType[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{form.id ? "Edit event type" : "New event type"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="30 minute meeting" />
            </div>
            <div>
              <Label>URL slug</Label>
              <Input value={form.slug ?? ""} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="30min" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.duration_minutes ?? 30} onChange={(e) => update("duration_minutes", Number(e.target.value))} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone ?? "Europe/London"} onValueChange={(v) => update("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TZ_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Select value={form.location_type ?? "google_meet"} onValueChange={(v) => update("location_type", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_meet">Google Meet (auto-created)</SelectItem>
                  <SelectItem value="in_person">In person</SelectItem>
                  <SelectItem value="phone">Phone call</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location details</Label>
              <Input
                value={form.location_details ?? ""}
                onChange={(e) => update("location_details", e.target.value)}
                placeholder={form.location_type === "in_person" ? "Address" : form.location_type === "phone" ? "Number" : "Notes"}
                disabled={form.location_type === "google_meet"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Buffer before (min)</Label>
              <Input type="number" value={form.buffer_before_minutes ?? 0} onChange={(e) => update("buffer_before_minutes", Number(e.target.value))} />
            </div>
            <div>
              <Label>Buffer after (min)</Label>
              <Input type="number" value={form.buffer_after_minutes ?? 0} onChange={(e) => update("buffer_after_minutes", Number(e.target.value))} />
            </div>
            <div>
              <Label>Min notice (min)</Label>
              <Input type="number" value={form.min_notice_minutes ?? 60} onChange={(e) => update("min_notice_minutes", Number(e.target.value))} />
            </div>
            <div>
              <Label>Max advance (days)</Label>
              <Input type="number" value={form.max_advance_days ?? 60} onChange={(e) => update("max_advance_days", Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium text-sm">Active</div>
              <div className="text-xs text-muted-foreground">Inactive event types are hidden from your public page.</div>
            </div>
            <Switch checked={form.is_active ?? true} onCheckedChange={(v) => update("is_active", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title || !form.slug}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityDialog({ eventTypeId, onClose }: { eventTypeId: string; onClose: () => void }) {
  const { data: rules = [] } = useAvailability(eventTypeId);
  const replace = useReplaceAvailability();
  // Convert rules to per-day map
  const initial: Record<number, { enabled: boolean; start: string; end: string }> = {};
  for (let d = 0; d < 7; d++) {
    const r = rules.find((r) => r.day_of_week === d);
    initial[d] = r
      ? { enabled: true, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) }
      : { enabled: d >= 1 && d <= 5, start: "09:00", end: "17:00" };
  }
  const [state, setState] = useState(initial);

  const save = () => {
    const out: AvailabilityRule[] = [];
    for (let d = 0; d < 7; d++) {
      const s = state[d];
      if (s.enabled) out.push({ day_of_week: d, start_time: `${s.start}:00`, end_time: `${s.end}:00` });
    }
    replace.mutate({ eventTypeId, rules: out }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Weekly availability</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {DAYS.map((day, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-12 text-sm">{day}</div>
              <Switch checked={state[idx].enabled} onCheckedChange={(v) => setState((s) => ({ ...s, [idx]: { ...s[idx], enabled: v } }))} />
              <Input type="time" value={state[idx].start} disabled={!state[idx].enabled}
                onChange={(e) => setState((s) => ({ ...s, [idx]: { ...s[idx], start: e.target.value } }))} className="w-32" />
              <span className="text-muted-foreground">–</span>
              <Input type="time" value={state[idx].end} disabled={!state[idx].enabled}
                onChange={(e) => setState((s) => ({ ...s, [idx]: { ...s[idx], end: e.target.value } }))} className="w-32" />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
