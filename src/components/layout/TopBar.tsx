import React, { useState } from "react";
import { Search, Plus, User, Calendar, CheckSquare, FileText, Bookmark, X, Sparkles, ShieldCheck, Eye, Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { SpaceSelector } from "@/components/layout/SpaceSelector";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AISearchDialog } from "@/components/ai/AISearchDialog";
import { useAdminMode, usePendingApprovalsCount } from "@/hooks/useAdminMode";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = "Today" }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, viewAs, toggle } = useAdminMode();
  const { data: pendingCount = 0 } = usePendingApprovalsCount();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center justify-between px-2 sm:px-4 md:px-6">
        {/* Left side - burger menu + title */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile burger menu */}
          <SidebarTrigger className="md:hidden h-8 w-8 shrink-0" />
          
          {/* Title - truncate on mobile */}
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
          
          {/* Space Selector - hidden on very small screens */}
          <div className="hidden sm:block">
            <SpaceSelector />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Global Search - desktop only */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-64 pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Quick Add Button - hidden on very small screens */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="hidden sm:inline-flex h-9 w-9">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Add</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <CheckSquare className="mr-2 h-4 w-4" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                New Event
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bookmark className="mr-2 h-4 w-4" />
                New Bookmark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Search */}
          <AISearchDialog />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden border-t p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all sections..."
              className="w-full pl-9 pr-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
