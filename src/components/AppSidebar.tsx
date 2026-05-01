
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CalendarDays,
  Activity,
  Wallet,
  Mail,
  MessageSquare,
  Settings,
  Share2,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckSquare,
  Target,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Lock,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import cnergiseLogo from "@/assets/cnergise-logo.png";
import { useAppFeatures, useMySubscriptions, hasActiveAccess } from "@/hooks/useFeatures";

// Map of route -> feature key (only for opt-in modules; core/system items omitted)
const navItems = [
  { icon: Sun, label: "Today", href: "/home", featureKey: null },
  { icon: CheckSquare, label: "Tasks", href: "/tasks", featureKey: "tasks" },
  { icon: FolderKanban, label: "Projects", href: "/projects", featureKey: "projects" },
  { icon: Target, label: "Goals", href: "/goals", featureKey: "goals" },
  { icon: GraduationCap, label: "Learning", href: "/learning", featureKey: "learning" },
  { icon: Share2, label: "Social", href: "/social", featureKey: "social" },
  { icon: Activity, label: "Health", href: "/health", featureKey: "health" },
  { icon: Wallet, label: "Finance", href: "/finances", featureKey: "finance" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio", featureKey: "portfolio" },
  { icon: Mail, label: "Mail", href: "/mail", featureKey: "mail" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar", featureKey: "calendar" },
  { icon: MessageSquare, label: "Chat", href: "/chat", featureKey: "chat" },
  { icon: Settings, label: "Settings", href: "/profile", featureKey: null },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: features } = useAppFeatures();
  const { data: subs } = useMySubscriptions();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      navigate("/");
    }
  };

  const getAccess = (featureKey: string | null) => {
    if (!featureKey) return { active: true, status: "active" as const };
    const f = features?.find((x) => x.key === featureKey);
    if (!f) return { active: true, status: "active" as const };
    return hasActiveAccess(f, subs);
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className={cn("p-2", !isCollapsed && "p-3")}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Link to="/home" aria-label="Go to home" className="flex items-center justify-center">
              <img src={cnergiseLogo} alt="Cnergise" className="object-contain shrink-0" style={{ height: '3rem', width: '3rem' }} />
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 shrink-0 border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link to="/home" aria-label="Go to home" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
              <img src={cnergiseLogo} alt="Cnergise" className="object-contain shrink-0" style={{ height: '3.75rem', width: '3.75rem' }} />
              <span className="font-semibold text-base truncate">Cnergise</span>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 shrink-0 border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:px-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const access = getAccess(item.featureKey);
                const isLocked = !access.active;
                const isPending = access.status === "pending_approval";
                const tooltip = isLocked
                  ? `${item.label} (${isPending ? "pending approval" : "locked — click to enable"})`
                  : item.label;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={tooltip}
                      asChild
                      className={cn(
                        "relative transition-colors duration-150",
                        isActive && "bg-sidebar-accent text-sidebar-primary font-medium",
                        isLocked && "opacity-60",
                      )}
                    >
                      <Link to={item.href}>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
                        )}
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isLocked && !isCollapsed && (
                          isPending ? <Clock className="h-3 w-3 ml-auto text-amber-500" /> : <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
