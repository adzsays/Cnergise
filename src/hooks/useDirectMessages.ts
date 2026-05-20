import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type DMContact = {
  id: string;
  handle: string;
  name: string | null;
  avatar_url: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
};

/** Look up a user by their @handle (returns null if not found) */
export async function findUserByHandle(handle: string) {
  const clean = handle.replace(/^@/, "").toLowerCase().trim();
  if (!clean) return null;
  const { data, error } = await supabase.rpc("find_user_by_handle", { _handle: clean });
  if (error) {
    console.error("find_user_by_handle error", error);
    return null;
  }
  return (data?.[0] ?? null) as DMContact | null;
}

/** List of distinct conversation partners (DM threads) */
export function useDMThreads() {
  const queryClient = useQueryClient();

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["dm-threads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: msgs, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by other party
      const byPartner = new Map<string, DirectMessage[]>();
      for (const m of (msgs ?? []) as DirectMessage[]) {
        const partner = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!byPartner.has(partner)) byPartner.set(partner, []);
        byPartner.get(partner)!.push(m);
      }
      const partnerIds = Array.from(byPartner.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, handle, name, avatar_url")
        .in("id", partnerIds);

      return partnerIds.map((pid) => {
        const list = byPartner.get(pid)!;
        const last = list[0];
        const profile = profiles?.find((p: any) => p.id === pid);
        const unread = list.filter((m) => m.recipient_id === user.id && !m.read_at).length;
        return {
          id: pid,
          handle: profile?.handle ?? "unknown",
          name: profile?.name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          last_message: last.content,
          last_message_at: last.created_at,
          unread_count: unread,
        } as DMContact;
      }).sort((a, b) =>
        (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
      );
    },
  });

  // Realtime: refresh threads on any DM change involving this user
  useEffect(() => {
    let cancelled = false;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      ch = supabase
        .channel(`dm-threads-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "direct_messages" },
          () => queryClient.invalidateQueries({ queryKey: ["dm-threads"] }),
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
    };
  }, [queryClient]);

  return { threads, isLoading };
}

/** Messages with a single partner */
export function useDMConversation(partnerId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["dm-conversation", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Mark inbound messages as read
      const unreadIds = (data ?? [])
        .filter((m: any) => m.recipient_id === user.id && !m.read_at)
        .map((m: any) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }

      return data as DirectMessage[];
    },
    enabled: !!partnerId,
  });

  // Realtime
  useEffect(() => {
    if (!partnerId) return;
    let cancelled = false;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      ch = supabase
        .channel(`dm-${user.id}-${partnerId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "direct_messages" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["dm-conversation", partnerId] });
            queryClient.invalidateQueries({ queryKey: ["dm-threads"] });
          },
        )
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
    };
  }, [partnerId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!partnerId) throw new Error("No recipient");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        recipient_id: partnerId,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onError: (e: Error) =>
      toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });

  return { messages, isLoading, sendMessage };
}
