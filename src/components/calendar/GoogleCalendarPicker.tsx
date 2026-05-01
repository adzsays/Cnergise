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
import { CalendarRange, Loader2 } from "lucide-react";

type GCalendar = {
  id: string;
  summary?: string;
  summaryOverride?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole?: string;
  enabled: boolean;
  subscribed: boolean;
};

export function GoogleCalendarPicker({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gcal-list"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ calendars: GCalendar[] }>(
        "google-calendar-list",
      );
      if (error) throw error;
      const cals = data?.calendars ?? [];
      const initial: Record<string, boolean> = {};
      for (const c of cals) initial[c.id] = c.enabled;
      setSelections(initial);
      return cals;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const calendars = (data ?? []).map((c) => ({
        google_calendar_id: c.id,
        summary: c.summaryOverride || c.summary,
        backgroundColor: c.backgroundColor,
        foregroundColor: c.foregroundColor,
        primary: c.primary,
        enabled: !!selections[c.id],
      }));
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
      qc.invalidateQueries({ queryKey: ["gcal-connection"] });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Google Calendars</DialogTitle>
          <DialogDescription>
            Pick which calendars to show. Disabled calendars stop syncing and their events are removed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-72 pr-3">
            <div className="space-y-2">
              {(data ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border p-3"
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
                      <p className="text-xs text-muted-foreground truncate">{c.id}</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!selections[c.id]}
                    onCheckedChange={(v) =>
                      setSelections((s) => ({ ...s, [c.id]: v }))
                    }
                  />
                </div>
              ))}
              {(data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No calendars found.
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            Refresh list
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
