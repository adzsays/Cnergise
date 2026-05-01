import { Button } from "@/components/ui/button";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { RefreshCw, Link2, Plus } from "lucide-react";
import { GoogleCalendarPicker } from "./GoogleCalendarPicker";

type GoogleCalendarConnectProps = {
  compact?: boolean;
};

export function GoogleCalendarConnect({ compact = false }: GoogleCalendarConnectProps) {
  const { connections, isConnected, connect, sync, isLoading } = useGoogleCalendar();

  if (isLoading) {
    return (
      <Button size="sm" variant="outline" disabled>
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Calendar
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
        <Link2 className="mr-2 h-4 w-4" /> Connect Google Calendar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
        <RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
        Sync ({connections.length})
      </Button>
      <GoogleCalendarPicker />
      <Button size="sm" variant="ghost" onClick={() => connect.mutate()} disabled={connect.isPending}>
        <Plus className="mr-1 h-4 w-4" /> Add account
      </Button>
    </div>
  );
}
