import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const GOOGLE_CALENDAR_CONNECTED_EVENT = "google-calendar-connected";

export type GCalConnection = {
  id: string;
  google_email: string | null;
  last_sync_at: string | null;
  primary_calendar_id: string | null;
};

export function useGoogleCalendar() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["gcal-connections"],
    queryFn: async (): Promise<GCalConnection[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("google_calendar_connections")
        .select("id, google_email, last_sync_at, primary_calendar_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      return (data ?? []) as GCalConnection[];
    },
  });

  const connect = useMutation({
    mutationFn: async () => {
      const oauthWindow = window.open("", "_blank", "width=560,height=720");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-oauth-start?origin=${encodeURIComponent(window.location.origin)}`;
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) throw new Error("Not signed in");
        const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const json = await res.json();
        if (!res.ok || !json.url) throw new Error(json.error || "Failed to start OAuth");

        if (oauthWindow && !oauthWindow.closed) {
          oauthWindow.location.assign(json.url);
        } else {
          window.location.assign(json.url);
        }
        return null;
      } catch (error) {
        oauthWindow?.close();
        throw error;
      }
    },
    onError: (e: Error) => toast({ title: "Connection failed", description: e.message, variant: "destructive" }),
  });

  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync");
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      toast({ title: "Synced", description: `${d?.synced ?? 0} events across ${d?.accounts ?? 0} account(s)` });
      qc.invalidateQueries({ queryKey: ["gcal-connections"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onError: (e: Error) => toast({ title: "Sync failed", description: e.message, variant: "destructive" }),
  });

  const disconnect = useMutation({
    mutationFn: async (accountId?: string) => {
      const { error } = await supabase.functions.invoke("google-calendar-disconnect", {
        body: accountId ? { account_id: accountId } : {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Account disconnected" });
      qc.invalidateQueries({ queryKey: ["gcal-connections"] });
      qc.invalidateQueries({ queryKey: ["gcal-list"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  useEffect(() => {
    const finishConnection = () => {
      toast({ title: "Google account connected" });
      sync.mutate();
      qc.invalidateQueries({ queryKey: ["gcal-connections"] });
    };

    const handleConnectedMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GOOGLE_CALENDAR_CONNECTED_EVENT) return;
      finishConnection();
    };

    window.addEventListener("message", handleConnectedMessage);

    const params = new URLSearchParams(window.location.search);
    if (params.get("gcal_callback") === "1" && params.get("status") === "success") {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: GOOGLE_CALENDAR_CONNECTED_EVENT }, window.location.origin);
        window.close();
        return () => window.removeEventListener("message", handleConnectedMessage);
      }

      finishConnection();
      window.history.replaceState({}, "", window.location.pathname);
    }

    return () => window.removeEventListener("message", handleConnectedMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connections,
    isLoading,
    connect,
    sync,
    disconnect,
    isConnected: connections.length > 0,
  };
}
