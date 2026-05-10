import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, MessageSquare } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AIBriefCard } from "./AIBriefCard";
import { CrossDataChat } from "./CrossDataChat";

type Scope = "today" | "finance" | "plan" | "health";

function deriveScope(pathname: string): { scope: Scope; label: string } {
  if (pathname.startsWith("/finances")) return { scope: "finance", label: "Finance" };
  if (pathname.startsWith("/plan")) return { scope: "plan", label: "Plan" };
  if (pathname.startsWith("/health")) return { scope: "health", label: "Health" };
  return { scope: "today", label: "Today" };
}

/**
 * Sidebar entry points for the AI brief + cross-data chat assistant.
 * Replaces the old floating bubbles so they don't overlap page content.
 * The brief auto-scopes to the current route.
 */
export function AISidebarPanel() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { scope, label } = deriveScope(pathname);

  const [briefOpen, setBriefOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:px-0">
        {!isCollapsed && <SidebarGroupLabel>AI</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={`${label} AI brief`}
                onClick={() => setBriefOpen(true)}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{label} brief</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Ask Cnergise"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Ask Cnergise</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Sheet open={briefOpen} onOpenChange={setBriefOpen}>
        <SheetContent side="right" className="w-[min(92vw,420px)] sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {label} AI brief
            </SheetTitle>
            <SheetDescription>
              Auto-scoped to the page you're on.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <AIBriefCard scope={scope} title={`${label} AI brief`} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-[min(92vw,420px)] sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Ask Cnergise
            </SheetTitle>
            <SheetDescription>
              Ask anything about your tasks, calendar, finances, or health.
            </SheetDescription>
          </SheetHeader>
          <CrossDataChat />
        </SheetContent>
      </Sheet>
    </>
  );
}
