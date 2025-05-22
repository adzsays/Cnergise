
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Inbox, Trash, Send, Archive, Star, 
  FilePlus, Search, Filter, Mail as MailIcon, 
  AlertCircle, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MailboxLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onCompose: () => void;
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  emailCount?: {
    inbox: number;
    starred: number;
    draft: number;
    sent: number;
  };
}

export function MailboxLayout({
  children,
  sidebarCollapsed,
  onToggleSidebar,
  onCompose,
  activeFolder,
  onFolderChange,
  emailCount = { inbox: 3, starred: 1, draft: 0, sent: 0 },
}: MailboxLayoutProps) {
  const folders = [
    { id: "inbox", name: "Inbox", icon: Inbox, count: emailCount.inbox },
    { id: "starred", name: "Starred", icon: Star, count: emailCount.starred },
    { id: "draft", name: "Drafts", icon: FilePlus, count: emailCount.draft },
    { id: "sent", name: "Sent", icon: Send, count: emailCount.sent },
    { id: "archive", name: "Archive", icon: Archive },
    { id: "spam", name: "Spam", icon: AlertCircle },
    { id: "trash", name: "Trash", icon: Trash },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={cn(
          "border-r bg-background/95 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Compose Button */}
        <div className="p-4">
          <Button
            onClick={onCompose}
            className={cn(
              "w-full gap-2",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <MailIcon className="h-4 w-4" />
            {!sidebarCollapsed && "Compose"}
          </Button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-auto">
          <nav className="space-y-1 p-2">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={activeFolder === folder.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  sidebarCollapsed && "justify-center px-0"
                )}
                onClick={() => onFolderChange(folder.id)}
              >
                <folder.icon className="h-4 w-4" />
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-2 flex-1 text-left">{folder.name}</span>
                    {folder.count && folder.count > 0 ? (
                      <span className="ml-auto text-xs font-medium">
                        {folder.count}
                      </span>
                    ) : null}
                  </>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {/* Toggle Sidebar */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            className="w-full h-8"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="border-b p-4 bg-background/95">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              className="pl-9 pr-12"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
