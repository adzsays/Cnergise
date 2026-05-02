import { Button } from "@/components/ui/button";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { RefreshCw, Link2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GoogleCalendarPicker } from "./GoogleCalendarPicker";

type GoogleCalendarConnectProps = {
  compact?: boolean;
};

export function GoogleCalendarConnect({ compact = false }: GoogleCalendarConnectProps) {
  const { connections, isConnected, connect, sync, isLoading } = useGoogleCalendar();

  if (isLoading) {
    return (
      <Button size="icon" variant="ghost" disabled className="h-8 w-8">
        <RefreshCw className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={() => connect.mutate()} disabled={connect.isPending} className="h-8 w-8">
              <Link2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Connect Google Calendar</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sync ({connections.length})</TooltipContent>
        </Tooltip>

        <GoogleCalendarPicker
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  {/* Using inline svg to avoid extra import */}
                  <CalendarIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage calendars</TooltipContent>
            </Tooltip>
          }
        />
      </div>
    </TooltipProvider>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
