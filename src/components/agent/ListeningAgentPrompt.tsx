import { useEffect, useRef, useState } from "react";
import { Bot, X, ExternalLink, Send, Sparkles, Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  source: string;
  author: string | null;
  preview: string;
  url: string | null;
  score: number;
  urgency: "now" | "today" | "later";
  reason: string | null;
  suggested_reply: string | null;
  message_at: string;
};

const URGENCY_TONE: Record<string, string> = {
  now: "bg-red-500",
  today: "bg-amber-500",
  later: "bg-sky-500",
};

export const ListeningAgentPrompt = () => {
  const [enabled, setEnabled] = useState(false);
  const [floatingEnabled, setFloatingEnabled] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Item | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const userId = useRef<string | null>(null);
  const { toast } = useToast();

  // bootstrap: load settings + pending items + subscribe
  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      userId.current = u.user.id;

      const { data: s } = await supabase
        .from("listening_agent_settings")
        .select("enabled, prompt_floating")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (s) {
        setEnabled(s.enabled);
        setFloatingEnabled(s.prompt_floating);
      } else {
        setEnabled(true);
        setFloatingEnabled(true);
      }

      const { data: pending } = await supabase
        .from("impact_messages")
        .select("id, source, author, preview, url, score, urgency, reason, suggested_reply, message_at")
        .eq("user_id", u.user.id)
        .is("notified_at", null)
        .eq("is_archived", false)
        .order("score", { ascending: false })
        .limit(10);
      setItems((pending ?? []) as Item[]);

      ch = supabase
        .channel(`listening-agent-${u.user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "impact_messages", filter: `user_id=eq.${u.user.id}` },
          (payload) => {
            const m = payload.new as any;
            if (m.notified_at || m.is_archived) return;
            setItems((prev) => (prev.some((x) => x.id === m.id) ? prev : [m as Item, ...prev]));
          },
        )
        .subscribe();
    })();
    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (active) setReply(active.suggested_reply ?? "");
  }, [active]);

  if (!enabled || !floatingEnabled || items.length === 0) return null;

  const top = items[0];

  const dismiss = async (item: Item) => {
    setBusy(true);
    await supabase
      .from("impact_messages")
      .update({ notified_at: new Date().toISOString(), is_read: true })
      .eq("id", item.id);
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    if (active?.id === item.id) setActive(null);
    setBusy(false);
  };

  const archive = async (item: Item) => {
    setBusy(true);
    await supabase
      .from("impact_messages")
      .update({ is_archived: true, notified_at: new Date().toISOString() })
      .eq("id", item.id);
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    if (active?.id === item.id) setActive(null);
    setBusy(false);
  };

  const copyReply = async () => {
    if (!reply.trim()) return;
    await navigator.clipboard.writeText(reply);
    toast({ title: "Reply copied", description: "Paste into your channel of choice." });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-medium">{items.length} for you</span>
        <span className={cn("h-2 w-2 rounded-full", URGENCY_TONE[top.urgency])} />
      </button>
    );
  }

  const current = active ?? top;

  return (
    <div className="fixed bottom-20 right-5 z-50 flex w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <div className="text-sm font-semibold">Listening Agent</div>
          <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex max-h-[28rem] flex-col">
        <div className="border-b p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", URGENCY_TONE[current.urgency])} />
            <span className="text-xs font-medium uppercase text-muted-foreground">{current.source}</span>
            {current.author && <span className="text-xs text-muted-foreground">· {current.author}</span>}
            <Badge variant="outline" className="ml-auto text-xs">{current.score}</Badge>
          </div>
          <div className="text-sm leading-relaxed">{current.preview}</div>
          {current.reason && (
            <div className="mt-2 flex items-start gap-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{current.reason}</span>
            </div>
          )}
        </div>

        <div className="border-b p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Suggested reply</div>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Agent will draft a reply for you…"
            className="text-sm"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={copyReply} disabled={!reply.trim()}>
              <Send className="mr-1 h-3 w-3" /> Copy reply
            </Button>
            {current.url && (
              <Button size="sm" variant="outline" asChild>
                <a href={current.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" /> Open
                </a>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => archive(current)} disabled={busy}>
              <Archive className="mr-1 h-3 w-3" /> Archive
            </Button>
            <Button size="sm" variant="ghost" onClick={() => dismiss(current)} disabled={busy} className="ml-auto">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Done"}
            </Button>
          </div>
        </div>

        {items.length > 1 && (
          <div className="overflow-y-auto p-2">
            <div className="px-1 pb-1 text-xs font-medium text-muted-foreground">Queue</div>
            {items.filter((x) => x.id !== current.id).map((x) => (
              <button
                key={x.id}
                onClick={() => setActive(x)}
                className="flex w-full items-start gap-2 rounded-md p-2 text-left text-xs hover:bg-muted"
              >
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", URGENCY_TONE[x.urgency])} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{x.author ?? x.source}</div>
                  <div className="truncate text-muted-foreground">{x.preview}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{x.score}</Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeningAgentPrompt;
