import { Card, CardContent } from "@/components/ui/card";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * On the main calendar screen this card ONLY renders when there is a sync
 * problem (reauth required or last sync error). Healthy state is hidden;
 * detailed sync status lives in the Manage Calendars dialog.
 */
export function SyncedCalendarsCard({ onManage }: { onManage?: () => void }) {
  const { connections, connect } = useGoogleCalendar();

  const issues = connections
    .map((c) => {
      const err = c.last_sync_error;
      const missingCalendarScope = !c.scope?.includes("/auth/calendar");
      if (!err && !c.reauth_required && !missingCalendarScope) return null;
      const needsReauth = Boolean(c.reauth_required) || missingCalendarScope || /refresh|invalid_grant|REAUTH|insufficient|permission|scope/i.test(err ?? "");
      return { conn: c, err: err ?? "Calendar permission is missing.", needsReauth };
    })
    .filter((x): x is { conn: typeof connections[number]; err: string; needsReauth: boolean } => !!x);

  if (issues.length === 0) return null;

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="space-y-3 pt-4">
        {issues.map(({ conn, err, needsReauth }) => (
          <div key={conn.id} className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-medium truncate">{conn.google_email}</p>
              <p className="text-[11px] text-destructive">
                {needsReauth ? "Reconnect to grant calendar access and resume syncing." : err}
              </p>
              <div className="flex gap-2 pt-0.5">
                {needsReauth ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] px-2"
                    onClick={() => connect.mutate()}
                    disabled={connect.isPending}
                  >
                    Reconnect
                  </Button>
                ) : null}
                {onManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] px-2"
                    onClick={onManage}
                  >
                    Manage
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
