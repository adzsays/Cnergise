
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Share,
  Layout,
  List,
  Columns,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationTabsProps {
  tabs?: Array<{
    label: string;
    value: string;
    href?: string;
  }>;
  activeTab: string;
  onTabChange?: (value: string) => void;
  actions?: React.ReactNode;
}

export function NavigationTabs({
  tabs = [
    { label: "Overview", value: "overview", href: "/dashboard" },
    { label: "List", value: "list", href: "/dashboard/list" },
    { label: "Board", value: "board", href: "/dashboard/board" },
  ],
  activeTab,
  onTabChange,
  actions,
}: NavigationTabsProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
            <span className="font-semibold">L</span>
          </div>
          <h1 className="font-semibold">Libre</h1>
          <Button variant="ghost" size="sm">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add card
          </Button>
        </div>
      </header>
      
      <div className="flex items-center border-b">
        <nav className="flex">
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab || 
              (tab.href && location.pathname === tab.href);
            
            // Fix TypeScript error by properly handling Link vs button
            if (tab.href) {
              return (
                <Link
                  key={tab.value}
                  to={tab.href}
                  className={cn(
                    "inline-flex h-10 items-center justify-center border-b-2 px-4 text-sm font-medium transition-colors hover:text-foreground",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted"
                  )}
                >
                  {tab.label}
                </Link>
              );
            } else {
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabChange?.(tab.value)}
                  className={cn(
                    "inline-flex h-10 items-center justify-center border-b-2 px-4 text-sm font-medium transition-colors hover:text-foreground",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted"
                  )}
                >
                  {tab.label}
                </button>
              );
            }
          })}
        </nav>
        
        <div className="ml-auto flex items-center gap-2 pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Layout className="mr-2 h-4 w-4" />
                View
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Layout className="mr-2 h-4 w-4" />
                Cards
              </DropdownMenuItem>
              <DropdownMenuItem>
                <List className="mr-2 h-4 w-4" />
                List
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Columns className="mr-2 h-4 w-4" />
                Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          
          {actions}
        </div>
      </div>
    </div>
  );
}
