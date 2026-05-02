import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Settings2, Archive, CheckCircle2, ExternalLink,
  AlertCircle, Clock, Inbox, Instagram, Facebook, Twitter, Linkedin,
  MessageSquare, Send as SendIcon, Mail, Loader2, RefreshCw, Bot,
} from "lucide-react";

type Urgency = "now" | "today" | "later";

interface ImpactMessage {
  id: string;
  source: string;
  author: string | null;
  author_handle: string | null;
  preview: string;
  url: string | null;
  score: number;
  urgency: Urgency;
  action_required: boolean;
  reason: string | null;
  matched_filters: string[];
  is_read: boolean;
  is_archived: boolean;
  message_at: string;
}

interface Filters {
  keywords: string[];
  handles: string[];
  people: string[];
  brands: string[];
  sources: Record<string, boolean>;
  min_score: number;
  action_required_only: boolean;
  realtime_enabled: boolean;
}

const SOURCE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: "text-green-500", label: "WhatsApp" },
  telegram: { icon: SendIcon, color: "text-sky-500", label: "Telegram" },
  email: { icon: Mail, color: "text-amber-500", label: "Email" },
  twitter: { icon: Twitter, color: "text-sky-400", label: "X/Twitter" },
  linkedin: { icon: Linkedin, color: "text-blue-600", label: "LinkedIn" },
  instagram: { icon: Instagram, color: "text-pink-500", label: "Instagram" },
  facebook: { icon: Facebook, color: "text-blue-500", label: "Facebook" },
};

const DEFAULT_FILTERS: Filters = {
  keywords: [],
  handles: [],
  people: [],
  brands: [],
  sources: {
    whatsapp: true, telegram: true, email: true, twitter: true,
    linkedin: true, instagram: true, facebook: true,
  },
  min_score: 60,
  action_required_only: false,
  realtime_enabled: true,
};

const arrayToText = (a: string[]) => a.join(", ");
const textToArray = (t: string) =>
  t.split(",").map((s) => s.trim()).filter(Boolean);

export const ImpactInbox = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ImpactMessage[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      await Promise.all([loadMessages(data.user.id), loadFilters(data.user.id)]);
      setLoading(false);
    })();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !filters.realtime_enabled) return;
    const channel = supabase
      .channel("impact-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "impact_messages", filter: `user_id=eq.${userId}` },
        () => loadMessages(userId),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, filters.realtime_enabled]);

  const loadMessages = async (uid: string) => {
    const { data, error } = await supabase
      .from("impact_messages")
      .select("*")
      .eq("user_id", uid)
      .eq("is_archived", false)
      .order("score", { ascending: false })
      .order("message_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error(error);
      return;
    }
    setMessages((data ?? []) as ImpactMessage[]);
  };

  const loadFilters = async (uid: string) => {
    const { data } = await supabase
      .from("impact_filters")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    if (data) {
      setFilters({
        keywords: data.keywords ?? [],
        handles: data.handles ?? [],
        people: data.people ?? [],
        brands: data.brands ?? [],
        sources: { ...DEFAULT_FILTERS.sources, ...(data.sources as any ?? {}) },
        min_score: data.min_score ?? 60,
        action_required_only: data.action_required_only ?? false,
        realtime_enabled: data.realtime_enabled ?? true,
      });
    }
  };

  const saveFilters = async (next: Filters) => {
    if (!userId) return;
    setFilters(next);
    const { error } = await supabase
      .from("impact_filters")
      .upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Couldn't save filters", description: error.message, variant: "destructive" });
    }
  };

  const buckets = useMemo(() => {
    const filtered = messages.filter((m) => filters.sources[m.source] !== false);
    return {
      now: filtered.filter((m) => m.urgency === "now"),
      today: filtered.filter((m) => m.urgency === "today"),
      later: filtered.filter((m) => m.urgency === "later"),
    };
  }, [messages, filters.sources]);

  const markRead = async (id: string) => {
    await supabase.from("impact_messages").update({ is_read: true }).eq("id", id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
  };

  const archive = async (id: string) => {
    await supabase.from("impact_messages").update({ is_archived: true }).eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const runDemoScan = async () => {
    setScoring(true);
    try {
      // Sample items pulled from the connected mock feeds (to demonstrate scoring).
      // In production these come from the WhatsApp/Telegram/Email/Twitter ingest jobs.
      const sample = [
        { source: "whatsapp", external_id: `demo-${Date.now()}-1`, author: "Mike", preview: "Can you approve the deployment by 3pm today? Need your sign-off.", message_at: new Date().toISOString() },
        { source: "email", external_id: `demo-${Date.now()}-2`, author: "Sarah Johnson", preview: "Invoice #4421 is overdue — please confirm payment status.", message_at: new Date().toISOString() },
        { source: "telegram", external_id: `demo-${Date.now()}-3`, author: "Crypto News", preview: "Bitcoin hits new ATH! 📈", message_at: new Date().toISOString() },
        { source: "twitter", external_id: `demo-${Date.now()}-4`, author: "Naval", author_handle: "@naval", preview: "Learn to sell. Learn to build.", message_at: new Date().toISOString() },
        { source: "linkedin", external_id: `demo-${Date.now()}-5`, author: "Emily Chen", preview: "Hey — interested in chatting about a partnership opportunity next week?", message_at: new Date().toISOString() },
      ];
      const { data, error } = await supabase.functions.invoke("score-impact", { body: { items: sample } });
      if (error) throw error;
      toast({ title: "AI scan complete", description: `${data?.scored ?? 0} of ${data?.total ?? 0} items deemed high impact.` });
      if (userId) await loadMessages(userId);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to scan";
      toast({
        title: msg.includes("402") ? "AI credits exhausted" : msg.includes("429") ? "Rate limited" : "Scan failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Impact Inbox</p>
            <p className="text-xs text-muted-foreground">
              Monitoring {Object.values(filters.sources).filter(Boolean).length} sources · min score {filters.min_score}
              {filters.action_required_only && " · action-required only"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runDemoScan} disabled={scoring}>
            {scoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Run AI scan
          </Button>
          <FilterSheet filters={filters} onSave={saveFilters} />
        </div>
      </div>

      {/* Three-pane */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Pane title="Now" icon={AlertCircle} accent="text-red-500" items={buckets.now} onRead={markRead} onArchive={archive} emptyHint="Nothing critical right now." />
          <Pane title="Today" icon={Clock} accent="text-amber-500" items={buckets.today} onRead={markRead} onArchive={archive} emptyHint="No items needing attention today." />
          <Pane title="Later" icon={Inbox} accent="text-muted-foreground" items={buckets.later} onRead={markRead} onArchive={archive} emptyHint="Inbox quiet — AI is monitoring." />
        </div>
      )}
    </div>
  );
};

const Pane = ({
  title, icon: Icon, accent, items, onRead, onArchive, emptyHint,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  items: ImpactMessage[];
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  emptyHint: string;
}) => (
  <Card className="flex flex-col">
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <Badge variant="secondary">{items.length}</Badge>
    </div>
    <ScrollArea className="h-[560px]">
      <CardContent className="space-y-2 p-3">
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          items.map((m) => <MessageRow key={m.id} m={m} onRead={onRead} onArchive={onArchive} />)
        )}
      </CardContent>
    </ScrollArea>
  </Card>
);

const MessageRow = ({
  m, onRead, onArchive,
}: {
  m: ImpactMessage;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
}) => {
  const meta = SOURCE_META[m.source] ?? { icon: Inbox, color: "text-muted-foreground", label: m.source };
  const SourceIcon = meta.icon;
  return (
    <div className={`group rounded-lg border p-3 transition-colors hover:bg-accent/40 ${m.is_read ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span title={meta.label}>
            <SourceIcon className={`h-4 w-4 ${meta.color}`} />
          </span>
          <span className="text-sm font-medium">{m.author ?? "Unknown"}</span>
          {m.author_handle && <span className="text-xs text-muted-foreground">{m.author_handle}</span>}
        </div>
        <div className="flex items-center gap-1">
          {m.action_required && <Badge variant="destructive" className="text-[10px]">Action</Badge>}
          <Badge variant="outline" className="text-[10px]">{m.score}</Badge>
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm">{m.preview}</p>
      {m.reason && (
        <div className="mt-2 flex items-start gap-1.5 rounded bg-primary/5 px-2 py-1 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <span>{m.reason}</span>
        </div>
      )}
      {m.matched_filters?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {m.matched_filters.slice(0, 4).map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {new Date(m.message_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {m.url && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={m.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
          )}
          {!m.is_read && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRead(m.id)} title="Mark read">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(m.id)} title="Archive">
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FilterSheet = ({ filters, onSave }: { filters: Filters; onSave: (f: Filters) => void }) => {
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          AI Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Impact filters</SheetTitle>
          <SheetDescription>Tell the AI agent what counts as "direct impact" for you.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Your handles (mentions of these = high impact)</Label>
            <Input
              placeholder="@adithya, @cnergise"
              value={arrayToText(draft.handles)}
              onChange={(e) => setDraft({ ...draft, handles: textToArray(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Important people</Label>
            <Input
              placeholder="Sarah Johnson, Mike Chen"
              value={arrayToText(draft.people)}
              onChange={(e) => setDraft({ ...draft, people: textToArray(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Brands</Label>
            <Input
              placeholder="Cnergise, Acme Corp"
              value={arrayToText(draft.brands)}
              onChange={(e) => setDraft({ ...draft, brands: textToArray(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Topic keywords</Label>
            <Input
              placeholder="invoice, contract, deadline, deploy"
              value={arrayToText(draft.keywords)}
              onChange={(e) => setDraft({ ...draft, keywords: textToArray(e.target.value) })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Minimum impact score</Label>
              <span className="text-sm font-medium">{draft.min_score}</span>
            </div>
            <Slider
              value={[draft.min_score]}
              min={0} max={100} step={5}
              onValueChange={(v) => setDraft({ ...draft, min_score: v[0] })}
            />
            <p className="text-xs text-muted-foreground">Hide noise — only show items the AI scores at or above this.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Action-required only</Label>
              <p className="text-xs text-muted-foreground">Hide FYI/news, keep only items that need a reply.</p>
            </div>
            <Switch
              checked={draft.action_required_only}
              onCheckedChange={(v) => setDraft({ ...draft, action_required_only: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Real-time scoring</Label>
              <p className="text-xs text-muted-foreground">Score new items as they arrive.</p>
            </div>
            <Switch
              checked={draft.realtime_enabled}
              onCheckedChange={(v) => setDraft({ ...draft, realtime_enabled: v })}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Sources to monitor</Label>
            {Object.entries(SOURCE_META).map(([key, meta]) => {
              const SrcIcon = meta.icon;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SrcIcon className={`h-4 w-4 ${meta.color}`} />
                    <span className="text-sm">{meta.label}</span>
                  </div>
                  <Switch
                    checked={draft.sources[key] !== false}
                    onCheckedChange={(v) => setDraft({ ...draft, sources: { ...draft.sources, [key]: v } })}
                  />
                </div>
              );
            })}
          </div>

          <Button className="w-full" onClick={() => onSave(draft)}>Save filters</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
