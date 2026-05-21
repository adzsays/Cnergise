import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, Video, MapPin, Phone, Globe, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const LOC_ICON: Record<string, any> = { google_meet: Video, in_person: MapPin, phone: Phone, custom: Globe };
const LOC_LABEL: Record<string, string> = { google_meet: "Google Meet", in_person: "In person", phone: "Phone call", custom: "Custom" };

type Host = { handle: string; name: string | null; avatar_url: string | null };
type EventType = {
  id: string; slug: string; title: string; description: string | null;
  duration_minutes: number; location_type: string; location_details: string | null;
  color: string | null; timezone: string;
};

export default function PublicBooking() {
  const { handle, slug } = useParams<{ handle: string; slug?: string }>();
  if (!handle) return <NotFound />;
  return slug ? <SlotPicker handle={handle} slug={slug} /> : <EventTypeList handle={handle} />;
}

function api(path: string, init?: RequestInit) {
  return fetch(`${FUNCTIONS_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      ...(init?.headers ?? {}),
    },
  });
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">Cnergise</span>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full p-4">{children}</main>
    </div>
  );
}

function NotFound() {
  return <PageShell><Card><CardContent className="p-8 text-center text-muted-foreground">Page not found.</CardContent></Card></PageShell>;
}

function HostHeader({ host }: { host: Host }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {host.avatar_url ? (
        <img src={host.avatar_url} alt={host.name ?? host.handle} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center text-primary font-semibold">
          {(host.name ?? host.handle).charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className="font-semibold">{host.name ?? `@${host.handle}`}</div>
        <div className="text-xs text-muted-foreground">@{host.handle}</div>
      </div>
    </div>
  );
}

function EventTypeList({ handle }: { handle: string }) {
  const [host, setHost] = useState<Host | null>(null);
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await api(`/booking-public-data?handle=${encodeURIComponent(handle)}`);
      const j = await r.json();
      if (r.ok) { setHost(j.host); setTypes(j.eventTypes ?? []); }
      setLoading(false);
    })();
  }, [handle]);

  if (loading) return <PageShell><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;
  if (!host) return <NotFound />;

  return (
    <PageShell>
      <HostHeader host={host} />
      <h1 className="text-xl font-semibold mb-3">Book a meeting</h1>
      <div className="grid gap-3">
        {types.map((et) => {
          const Icon = LOC_ICON[et.location_type] ?? Globe;
          return (
            <Link to={`/book/${handle}/${et.slug}`} key={et.id}>
              <Card className="hover:border-primary transition-colors">
                <div className="h-1 rounded-t" style={{ background: et.color || "hsl(var(--primary))" }} />
                <CardContent className="p-4">
                  <div className="font-medium">{et.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {et.duration_minutes} min</span>
                    <span className="flex items-center gap-1"><Icon className="h-3 w-3" /> {LOC_LABEL[et.location_type]}</span>
                  </div>
                  {et.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{et.description}</p>}
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {types.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">No event types available.</CardContent></Card>}
      </div>
    </PageShell>
  );
}

function SlotPicker({ handle, slug }: { handle: string; slug: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [host, setHost] = useState<Host | null>(null);
  const [et, setEt] = useState<EventType | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState<any>(null);

  const myTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  useEffect(() => {
    (async () => {
      const r = await api(`/booking-public-data?handle=${encodeURIComponent(handle)}&slug=${encodeURIComponent(slug)}`);
      const j = await r.json();
      if (r.ok) { setHost(j.host); setEt(j.eventType); setQuestions(j.questions ?? []); }
      setLoading(false);
    })();
  }, [handle, slug]);

  useEffect(() => {
    if (!et || !date) return;
    (async () => {
      setSlotsLoading(true);
      setPicked(null);
      const iso = date.toISOString().slice(0, 10);
      const r = await api(`/booking-slots?handle=${encodeURIComponent(handle)}&slug=${encodeURIComponent(slug)}&from=${iso}&to=${iso}`);
      const j = await r.json();
      setSlots(r.ok ? (j.slots ?? []) : []);
      setSlotsLoading(false);
    })();
  }, [et, date, handle, slug]);

  if (loading) return <PageShell><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;
  if (!host || !et) return <NotFound />;

  if (done) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">You're booked!</h2>
            <p className="text-muted-foreground">{new Date(done.start_time).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</p>
            {done.meet_link && (
              <Button asChild><a href={done.meet_link} target="_blank" rel="noreferrer">Join Google Meet</a></Button>
            )}
            {done.location_snapshot && !done.meet_link && (
              <p className="text-sm">{done.location_snapshot}</p>
            )}
            <p className="text-xs text-muted-foreground">A confirmation has been added to {host.name ?? `@${host.handle}`}'s calendar and the host has invited you.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const Icon = LOC_ICON[et.location_type] ?? Globe;

  if (confirming && picked) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      const r = await api(`/booking-create`, {
        method: "POST",
        body: JSON.stringify({
          handle, slug,
          start_time: picked,
          invitee_name: form.name,
          invitee_email: form.email,
          invitee_notes: form.notes || null,
          timezone: myTz,
          answers,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast({ title: "Couldn't book", description: j.error?.toString?.() || j.detail || "Try a different time", variant: "destructive" });
        return;
      }
      setDone(j.booking);
    };
    return (
      <PageShell>
        <HostHeader host={host} />
        <Card>
          <CardHeader>
            <CardTitle>{et.title}</CardTitle>
            <CardDescription className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {et.duration_minutes} min</span>
              <span className="flex items-center gap-1"><Icon className="h-3 w-3" /> {LOC_LABEL[et.location_type]}</span>
              <span>· {new Date(picked).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              {questions.map((q) => (
                <div key={q.id}>
                  <Label>{q.label}{q.required && " *"}</Label>
                  <Input
                    required={q.required}
                    type={q.question_type === "email" ? "email" : q.question_type === "phone" ? "tel" : "text"}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <Label>Notes (optional)</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirming(false)}>Back</Button>
                <Button type="submit" className="flex-1">Confirm booking</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <HostHeader host={host} />
      <Card>
        <div className="h-1 rounded-t" style={{ background: et.color || "hsl(var(--primary))" }} />
        <CardHeader>
          <CardTitle>{et.title}</CardTitle>
          <CardDescription className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {et.duration_minutes} min</span>
            <span className="flex items-center gap-1"><Icon className="h-3 w-3" /> {LOC_LABEL[et.location_type]}</span>
            <Badge variant="outline" className="text-[10px]">{myTz}</Badge>
          </CardDescription>
          {et.description && <p className="text-sm text-muted-foreground mt-2">{et.description}</p>}
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d < new Date(new Date().toDateString())}
            className="rounded-md border"
          />
          <div>
            <div className="text-sm font-medium mb-2">
              {date?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">Loading times…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No times available on this day.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {slots.map((s) => (
                  <Button key={s} variant="outline" size="sm"
                    onClick={() => { setPicked(s); setConfirming(true); }}>
                    {new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
