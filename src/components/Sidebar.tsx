
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Target,
  Heart,
  PieChart,
  Mail,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Users,
  Shield,
} from "lucide-react";
import cnergiseLogo from "@/assets/cnergise-logo.png";

type SidebarItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  disabled?: boolean;
};

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks", badge: 5 },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Mail, label: "Mail", href: "/mail", badge: 3 },
  { icon: BarChart3, label: "Finances", href: "/finances" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Heart, label: "Health", href: "/health" },
  { icon: PieChart, label: "Portfolio", href: "/portfolio" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Shield, label: "Admin", href: "/admin" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const activeItem = location.pathname === "/" ? "/" : location.pathname;

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border relative",
        expanded ? "w-64" : "w-20",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-5">
        {expanded ? (
          <Link to="/" className="flex items-center gap-2">
            <img src={cnergiseLogo} alt="Cnergise" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">Cnergise</span>
          </Link>
        ) : (
          <Link to="/" className="w-12 h-12 mx-auto flex items-center justify-center">
            <img src={cnergiseLogo} alt="Cnergise" className="h-10 w-10 object-contain" />
          </Link>
        )}
      </div>

      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = activeItem === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  item.disabled && "opacity-50 pointer-events-none"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {expanded && (
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                )}
                {expanded && item.badge && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium rounded-full bg-taskfinity-teal text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="mt-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <Settings className="w-5 h-5 mr-3" />
            {expanded && <span>Settings</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            {expanded && <span>Help</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {expanded && <span>Logout</span>}
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-4 top-10 bg-white dark:bg-card shadow-md h-8 w-8 rounded-full border border-border"
      >
        {expanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
