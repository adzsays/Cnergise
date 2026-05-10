import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendarSubscriptions } from "@/hooks/useCalendarSubscriptions";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { AlertTriangle, CalendarX, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncedCalendarsCard({ onManage }: { onManage?: () => void }) {
  const { data: subData, isLoading: subsLoading } = useCalendarSubscriptions();
  const { connections, sync, connect, isConnected } = useGoogleCalendar();

  const subscriptions = subData?.subscriptions ?? [];
  const accounts = subData?.accounts ?? [];

  if (!isConnected && connections.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Synced Calendars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground gap-2">
            <CalendarX className="h-6 w-6 opacity-30" />
            <p className="text-xs">No Google accounts connected.</p>
            {onManage && (
              <Button size="sm" variant="outline" onClick={onManage}>
                Connect account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Synced Calendars</CardTitle>
        {onManage && (
          <Button size="sm" variant="ghost" onClick={onManage} className="h-7 text-xs">
            Manage
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((account) => {
          const accountCals = subscriptions.filter(
            (s) => s.account_id === account.id && s.enabled
          );
          const conn = connections.find((c) => c.google_email === account.google_email);
          const lastSync = conn?.last_sync_at;
          const syncError = conn?.last_sync_error;
          const needsReauth = !!syncError && /refresh|invalid_grant|REAUTH/i.test(syncError);

          return (
            <div key={account.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{account.google_email}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => sync.mutate()}
                  disabled={sync.isPending}
                >
                  <RefreshCw className={`h-3 w-3 ${sync.isPending ? "animate-spin" : ""}`} />
                </Button>
              </div>
              {needsReauth ? (
                <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/5 p-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-destructive font-medium">Sign-in expired — events won't update.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 mt-1 text-[11px] px-2"
                      onClick={() => connect.mutate()}
                      disabled={connect.isPending}
                    >
                      Reconnect
                    </Button>
                  </div>
                </div>
              ) : lastSync ? (
                <p className="text-[10px] text-muted-foreground">
                  Last synced: {new Date(lastSync).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </p>
              ) : null}
              <div className="space-y-1">
                {accountCals.length > 0 ? (
                  accountCals.map((cal) => (
                    <div key={cal.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full border"
                        style={{ backgroundColor: cal.background_color || "#9ca3af" }}
                      />
                      <span className="truncate">{cal.summary}</span>
                      {cal.is_primary && (
                        <span className="text-[10px] text-muted-foreground shrink-0">(primary)</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No calendars enabled.</p>
                )}
              </div>
            </div>
          );
        })}

        {subsLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
