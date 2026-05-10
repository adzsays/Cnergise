import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { CalendarRange, Loader2, Plus, RefreshCw, Unlink } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

type GCalendar = {
  id: string;
  summary?: string;
  summaryOverride?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  enabled: boolean;
};

type GAccount = {
  account_id: string;
  email: string;
  last_sync_at?: string | null;
  calendars: GCalendar[];
  error?: string;
};

export function GoogleCalendarPicker({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    controlledOnOpenChange?.(v);
  };
  // selections keyed by `${account_id}::${calendar_id}`
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const qc = useQueryClient();
  const { connect, disconnect, sync, connections } = useGoogleCalendar();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gcal-list"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ accounts: GAccount[] }>(
        "google-calendar-list",
      );
      if (error) throw error;
      const accounts = data?.accounts ?? [];
      const initial: Record<string, boolean> = {};
      for (const a of accounts) {
        for (const c of a.calendars) initial[`${a.account_id}::${c.id}`] = c.enabled;
      }
      setSelections(initial);
      return accounts;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const calendars: any[] = [];
      for (const a of data ?? []) {
        for (const c of a.calendars) {
          calendars.push({
            account_id: a.account_id,
            google_calendar_id: c.id,
            summary: c.summaryOverride || c.summary,
            backgroundColor: c.backgroundColor,
            foregroundColor: c.foregroundColor,
            primary: c.primary,
            enabled: !!selections[`${a.account_id}::${c.id}`],
          });
        }
      }
      const { error } = await supabase.functions.invoke("google-calendar-subscribe", {
        body: { calendars },
      });
      if (error) throw error;
      const { error: syncError } = await supabase.functions.invoke("google-calendar-sync");
      if (syncError) throw syncError;
    },
    onSuccess: () => {
      toast({ title: "Calendars updated", description: "Selected calendars have been synced." });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["gcal-connections"] });
      setOpen(false);
    },
    onError: (e: Error) =>
      toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <CalendarRange className="mr-2 h-4 w-4" /> Manage Calendars
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Google Calendars</DialogTitle>
          <DialogDescription>
            Connect multiple Gmail accounts and pick which calendars from each to show.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-3">
            <div className="space-y-4">
              {(data ?? []).map((account) => (
                <div key={account.account_id} className="rounded-lg border">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{account.email}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {account.error
                          ? `Error: ${account.error}`
                          : (() => {
                              const conn = connections.find((c) => c.google_email === account.email);
                              const last = conn?.last_sync_at;
                              return last
                                ? `Last synced ${new Date(last).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`
                                : `${account.calendars.length} calendar(s)`;
                            })()}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => sync.mutate()}
                      disabled={sync.isPending}
                      title="Sync now"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => disconnect.mutate(account.account_id)}
                      disabled={disconnect.isPending}
                    >
                      <Unlink className="h-3.5 w-3.5 mr-1" /> Disconnect
                    </Button>
                  </div>
                  <div className="p-2 space-y-1">
                    {account.calendars.map((c) => {
                      const key = `${account.account_id}::${c.id}`;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full border"
                              style={{ backgroundColor: c.backgroundColor || "#9ca3af" }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {c.summaryOverride || c.summary}
                                {c.primary && (
                                  <span className="ml-2 text-xs text-muted-foreground">(primary)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={!!selections[key]}
                            onCheckedChange={(v) =>
                              setSelections((s) => ({ ...s, [key]: v }))
                            }
                          />
                        </div>
                      );
                    })}
                    {account.calendars.length === 0 && !account.error && (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No calendars found.
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No Google accounts connected yet.
                </p>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
              >
                <Plus className="mr-2 h-4 w-4" /> Add another Google account
              </Button>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
