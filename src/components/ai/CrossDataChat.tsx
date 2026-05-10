import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Embeddable chat UI for the cross-data assistant.
 * Extracted from CrossDataAssistant so it can be mounted inside the sidebar Sheet.
 */
export function CrossDataChat() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about your tasks, projects, calendar, finances, or health. e.g. 'How much did I spend on food last week?' or 'What's due tomorrow?'",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const trimmed = next.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("cross-data-assistant", {
        body: { messages: trimmed },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: (data as any).reply || "(no reply)" },
      ]);
    } catch (e: any) {
      toast.error(e.message || "Assistant failed");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I hit an error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> thinking…
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-2 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your data…"
          disabled={loading}
          className="text-sm"
        />
        <Button size="icon" onClick={send} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
