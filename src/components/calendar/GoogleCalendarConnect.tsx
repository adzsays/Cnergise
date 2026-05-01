import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Calendar, RefreshCw, Link2, Unlink } from "lucide-react";

type GoogleCalendarConnectProps = {
  compact?: boolean;
};

export function GoogleCalendarConnect({ compact = false }: GoogleCalendarConnectProps) {
  const { connection, isConnected, connect, sync, disconnect, isLoading } = useGoogleCalendar();

  if (compact) {
    if (isLoading) {
      return (
        <Button size="sm" variant="outline" disabled>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Calendar
        </Button>
      );
    }

    return isConnected ? (
      <Button size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
        <RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} /> Sync Gmail Calendar
      </Button>
    ) : (
      <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
        <Link2 className="mr-2 h-4 w-4" /> Connect Gmail Calendar
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" /> Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isConnected ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{connection?.google_email}</p>
                <p className="text-xs text-muted-foreground">
                  {connection?.last_sync_at
                    ? `Last sync: ${new Date(connection.last_sync_at).toLocaleString()}`
                    : "Not synced yet"}
                </p>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${sync.isPending ? "animate-spin" : ""}`} />
                Sync now
              </Button>
              <Button size="sm" variant="ghost" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                <Unlink className="h-3.5 w-3.5 mr-1" /> Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Two-way sync your Google Calendar. Events created here push to Google, and Google updates flow back automatically.
            </p>
            <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
              <Link2 className="h-3.5 w-3.5 mr-1" /> Connect Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
