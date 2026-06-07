
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  tabs = [],
  activeTab,
  onTabChange,
  actions,
}: NavigationTabsProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center border-b">
        <nav className="flex flex-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab ||
              (tab.href && location.pathname === tab.href);

            if (tab.href) {
              return (
                <Link
                  key={tab.value}
                  to={tab.href}
                  className={cn(
                    "inline-flex h-10 items-center justify-center border-b-2 px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted"
                  )}
                >
                  {tab.label}
                </Link>
              );
            }
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  "inline-flex h-10 items-center justify-center border-b-2 px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {actions && (
          <div className="ml-auto flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
