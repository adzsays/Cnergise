
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Home,
  Inbox,
  FileText,
  LayoutDashboard,
  CheckSquare,
  PanelLeft,
  ClipboardList,
  Pulse,
  Clock,
  PlusCircle,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Inbox, label: "Inbox", href: "/inbox", badge: 3 },
  { icon: FileText, label: "Docs", href: "/docs" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks", badge: 5 },
  { icon: PanelLeft, label: "Whiteboards", href: "/whiteboards" },
  { icon: ClipboardList, label: "Forms", href: "/forms" },
  { icon: Pulse, label: "Pulse", href: "/pulse" },
  { icon: Clock, label: "Timesheets", href: "/timesheets" },
];

export function AppSidebar() {
  const location = useLocation();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <span className="font-semibold">C</span>
          </div>
          <span className="font-medium text-lg">Corential</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    isActive={location.pathname === item.href}
                    tooltip={item.label}
                    asChild
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Spaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-muted-foreground">Everything</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <PlusCircle className="h-3 w-3" />
              </Button>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-white">
                    <span className="text-xs">L</span>
                  </div>
                  <span>Libre</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500 text-white">
                    <span className="text-xs">M</span>
                  </div>
                  <span>Maud Street</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-700 text-white">
                    <span className="text-xs">C</span>
                  </div>
                  <span>Corential</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-500 text-white">
                    <span className="text-xs">V</span>
                  </div>
                  <span>Valuetrix</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            <span>Invite</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
