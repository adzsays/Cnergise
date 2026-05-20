import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Session = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  page_url: string | null;
  status: string;
  last_message_at: string;
  unread_admin_count: number;
};
type Message = { id: string; role: string; content: string; created_at: string };

export default function AdminInbox() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadSessions = async () => {
    const { data } = await supabase
      .from("visitor_chat_sessions")
      .select("id, visitor_name, visitor_email, page_url, status, last_message_at, unread_admin_count")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setSessions((data as Session[]) ?? []);
  };

  useEffect(() => {
    loadSessions();
    const ch = supabase
      .channel("visitor_chat_sessions_visitor_chat_messages_admin-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_chat_sessions" }, loadSessions)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visitor_chat_messages" }, (p) => {
        const m = p.new as any;
        if (m.session_id === activeId) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId]);

  const openSession = async (id: string) => {
    setActiveId(id);
    setLoading(true);
    const { data } = await supabase
      .from("visitor_chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", id)
      .order("created_at");
    setMessages((data as Message[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const active = useMemo(() => sessions.find((s) => s.id === activeId), [sessions, activeId]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !active) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("visitor_chat_messages").insert({
      session_id: active.id,
      role: "admin",
      content: text,
      admin_user_id: u.user?.id,
    });
    if (error) {
      toast({ title: "Could not send", description: error.message, variant: "destructive" });
      return;
    }
    setReply("");
    // mark as human takeover
    if (active.status !== "human") {
      await supabase.from("visitor_chat_sessions").update({ status: "human" }).eq("id", active.id);
    }
    await supabase
      .from("visitor_chat_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", active.id);
  };

  const handBack = async () => {
    if (!active) return;
    await supabase.from("visitor_chat_sessions").update({ status: "ai" }).eq("id", active.id);
    toast({ title: "Handed back to AI" });
  };

  const filtered = sessions.filter((s) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      (s.visitor_email ?? "").toLowerCase().includes(q) ||
      (s.visitor_name ?? "").toLowerCase().includes(q) ||
      (s.page_url ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-xl font-semibold">Visitor Inbox</h1>
        <p className="text-xs text-muted-foreground">AI handles tier-1, you can take over any conversation.</p>
      </header>
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <aside className="flex flex-col border-r">
          <div className="border-b p-3">
            <Input placeholder="Search visitors…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {filtered.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
              )}
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className={`flex flex-col gap-1 border-b px-4 py-3 text-left transition hover:bg-muted ${
                    activeId === s.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">
                      {s.visitor_name || s.visitor_email || "Anonymous visitor"}
                    </div>
                    <Badge variant={s.status === "human" ? "default" : "secondary"} className="shrink-0">
                      {s.status === "human" ? <User className="mr-1 h-3 w-3" /> : <Bot className="mr-1 h-3 w-3" />}
                      {s.status}
                    </Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{s.visitor_email || s.page_url}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(s.last_message_at), { addSuffix: true })}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>
        <main className="flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">
                    {active.visitor_name || active.visitor_email || "Anonymous visitor"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {active.visitor_email} · {active.page_url}
                  </div>
                </div>
                {active.status === "human" && (
                  <Button size="sm" variant="outline" onClick={handBack}>
                    Hand back to AI
                  </Button>
                )}
              </div>
              <ScrollArea className="flex-1">
                <div ref={scrollRef} className="flex flex-col gap-3 p-4">
                  {loading && (
                    <div className="flex justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "visitor"
                          ? "mr-auto bg-muted"
                          : m.role === "admin"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "ml-auto border bg-card"
                      }`}
                    >
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {m.role}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex items-end gap-2 border-t p-3">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Reply as team (this pauses the AI)…"
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={sendReply} disabled={!reply.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
