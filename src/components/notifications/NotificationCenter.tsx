import { useState } from "react";
import { Bell, Check, CheckCheck, Mail, Calendar, DollarSign, Target, Users, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnifiedMetadata } from "@/hooks/useUnifiedMetadata";
import { formatDistanceToNow } from "date-fns";

const sourceIcons: Record<string, any> = {
  email: Mail,
  calendar: Calendar,
  finance: DollarSign,
  task: Target,
  goal: Target,
  contact: Users,
  chat: MessageSquare,
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-destructive/10 text-destructive",
};

export function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead } = useUnifiedMetadata();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications?.length || 0;

  const handleNotificationClick = (notification: any) => {
    markAsRead.mutate(notification.id);
    
    // If there's an external URL, open it
    if (notification.external_url) {
      window.open(notification.external_url, '_blank');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 sm:w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No new notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = sourceIcons[notification.source_type] || Bell;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-2 rounded-full ${priorityColors[notification.notification_priority]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {notification.external_url && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate(notification.id);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
