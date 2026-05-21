import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

export function GoogleReauthBanner() {
  const { connections, connect } = useGoogleCalendar();
  const needs = connections.filter((c) => c.reauth_required);
  if (needs.length === 0) return null;
  return (
    <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
      <div className="flex items-start gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
        <div>
          <p className="font-medium">Google Calendar sign-in expired</p>
          <p className="text-xs text-muted-foreground">
            Reconnect {needs.map((c) => c.google_email).filter(Boolean).join(", ") || "your account"} to keep events in sync.
          </p>
        </div>
      </div>
      <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Reconnect
      </Button>
    </div>
  );
}
