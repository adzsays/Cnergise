import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AtSign, Send, MessageSquare, UserPlus, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { useDMThreads, useDMConversation, findUserByHandle, DMContact } from "@/hooks/useDirectMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  myHandle: string | null;
}

function initials(name?: string | null, handle?: string | null) {
  const src = name || handle || "?";
  return src.split(/\s+/).map((s) => s[0]).join("").toUpperCase().slice(0, 2);
}

export function DirectMessages({ myHandle }: Props) {
  const { threads, isLoading } = useDMThreads();
  const [partner, setPartner] = useState<DMContact | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [lookupHandle, setLookupHandle] = useState("");
  const [looking, setLooking] = useState(false);

  const startNewChat = async () => {
    setLooking(true);
    const found = await findUserByHandle(lookupHandle);
    setLooking(false);
    if (!found) {
      toast.error("No user with that handle");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (found.id === user?.id) {
      toast.error("You can't message yourself");
      return;
    }
    // Invite-only: must already be in your contacts (matched by email or handle stored in notes)
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, email, notes")
      .eq("user_id", user!.id);
    const isContact = (contacts ?? []).some((c: any) =>
      (c.notes && c.notes.toLowerCase().includes(`@${found.handle}`)),
    );
    if (!isContact) {
      toast.error(
        `Invite-only: add @${found.handle} to your Contacts first (put @${found.handle} in their notes).`,
      );
      return;
    }
    setPartner(found);
    setNewDialogOpen(false);
    setLookupHandle("");
  };

  if (partner) {
    return <ConversationView partner={partner} onBack={() => setPartner(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Your Cnergise ID</p>
          <p className="font-medium truncate">
            {myHandle ? `@${myHandle}` : <span className="text-muted-foreground">Not set</span>}
          </p>
        </div>
        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!myHandle}>
              <UserPlus className="h-4 w-4 mr-1.5" /> New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a direct message</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter their @handle. They must already be in your Contacts (with @handle in their notes) to receive a message.
              </p>
              <div className="relative">
                <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={lookupHandle.replace(/^@/, "")}
                  onChange={(e) => setLookupHandle(e.target.value)}
                  placeholder="handle"
                  className="pl-8"
                  onKeyDown={(e) => e.key === "Enter" && startNewChat()}
                />
              </div>
              <Button onClick={startNewChat} disabled={looking || !lookupHandle.trim()} className="w-full">
                <Search className="h-4 w-4 mr-1.5" />
                {looking ? "Looking…" : "Find & message"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : threads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No direct messages yet.</p>
            <p className="text-xs mt-1">Tap "New" to start a chat with a contact's @handle.</p>
          </div>
        ) : (
          <div className="divide-y">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setPartner(t)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 text-left transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials(t.name, t.handle)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {t.name || `@${t.handle}`}
                    </span>
                    {t.last_message_at && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(t.last_message_at), "MMM d")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{t.last_message}</p>
                    {(t.unread_count ?? 0) > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{t.unread_count}</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ConversationView({ partner, onBack }: { partner: DMContact; onBack: () => void }) {
  const { messages, sendMessage } = useDMConversation(partner.id);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage.mutateAsync(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-3 bg-background/95 backdrop-blur">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials(partner.name, partner.handle)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{partner.name || `@${partner.handle}`}</p>
          <p className="text-xs text-muted-foreground">@{partner.handle}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Send a message to start the conversation.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(m.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message @${partner.handle}`}
        />
        <Button type="submit" size="icon" disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
