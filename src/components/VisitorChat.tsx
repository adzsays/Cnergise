import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { id?: string; role: "visitor" | "assistant" | "admin" | "system"; content: string };

const STORAGE_KEY = "cnergise_visitor_chat_token";

export const VisitorChat = () => {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "visitor_chat_enabled")
        .maybeSingle();
      setEnabled(data?.value === "true");
    })();
  }, []);

  // load history when opening
  useEffect(() => {
    if (!open || !token) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("visitor-chat", {
        body: { action: "history", session_token: token },
      });
      if (error || !data || data.error) {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        return;
      }
      setSessionId(data.session_id);
      setMessages(data.messages ?? []);
    })();
  }, [open, token]);

  // realtime: listen for admin/AI replies
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`visitor-chat-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "visitor_chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, { id: m.id, role: m.role, content: m.content }];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const startSession = async () => {
    setStarting(true);
    const { data, error } = await supabase.functions.invoke("visitor-chat", {
      body: {
        action: "start",
        email: email || null,
        page_url: window.location.href,
      },
    });
    setStarting(false);
    if (error || !data?.session_token) return;
    localStorage.setItem(STORAGE_KEY, data.session_token);
    setToken(data.session_token);
    setSessionId(data.session_id);
    setMessages([
      {
        role: "assistant",
        content: "Hi 👋 I'm Cnergise's AI assistant. Ask me anything — pricing, features, integrations. I'll loop in a human if I can't help.",
      },
    ]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !token) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "visitor", content: text }]);
    setSending(true);
    const { data } = await supabase.functions.invoke("visitor-chat", {
      body: { action: "send", session_token: token, content: text, email: email || undefined },
    });
    setSending(false);
    if (data?.ai_replied && data?.content) {
      setMessages((prev) => {
        // avoid duplicate if realtime already inserted
        if (prev.some((m) => m.role === "assistant" && m.content === data.content)) return prev;
        return [...prev, { role: "assistant", content: data.content }];
      });
    }
  };

  if (!enabled) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Chat with us</span>
        </button>
      )}

      {open && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl",
            "h-[min(560px,calc(100dvh-3rem))]"
          )}
        >
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <div className="text-sm font-semibold">Cnergise Assistant</div>
              <div className="text-xs opacity-80">AI-powered • human handoff available</div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!token ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Hi! Drop your email (optional) so we can follow up if needed.
              </p>
              <Input
                type="email"
                placeholder="you@example.com (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={startSession} disabled={starting} className="w-full">
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start chat"}
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div ref={scrollRef} className="flex flex-col gap-3 p-4">
                  {messages.map((m, i) => (
                    <div
                      key={m.id ?? i}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        m.role === "visitor"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : m.role === "admin"
                          ? "mr-auto border border-primary/30 bg-primary/5"
                          : "mr-auto bg-muted"
                      )}
                    >
                      {m.role === "admin" && (
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Team
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    </div>
                  ))}
                  {sending && (
                    <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-end gap-2 border-t p-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your message…"
                  rows={1}
                  className="min-h-0 resize-none"
                />
                <Button size="icon" onClick={send} disabled={!input.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default VisitorChat;
