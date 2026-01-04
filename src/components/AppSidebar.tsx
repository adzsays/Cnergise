
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
  SidebarTrigger,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import cnergiseLogo from "@/assets/cnergise-logo.png";

// Core navigation items per spec
const navItems = [
  { icon: Sun, label: "Today", href: "/home" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: GraduationCap, label: "Learning", href: "/learning" },
  { icon: Share2, label: "Social", href: "/social" },
  { icon: Activity, label: "Health", href: "/health" },
  { icon: Wallet, label: "Finance", href: "/finances" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio" },
  { icon: Mail, label: "Mail", href: "/mail" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/profile" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      navigate("/");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={cnergiseLogo} 
              alt="Cnergise" 
              className="h-10 w-10 object-contain shrink-0"
            />
            {!isCollapsed && (
              <span className="font-semibold text-base">Cnergise</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      asChild
                      className={cn(
                        "relative transition-colors duration-150",
                        isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
                      )}
                    >
                      <Link to={item.href}>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
                        )}
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
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
