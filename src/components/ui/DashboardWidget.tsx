
import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TimeRange = "today" | "week" | "month";

interface DashboardWidgetProps {
  title: string;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  showTimeFilter?: boolean;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function DashboardWidget({
  title,
  timeRange = "today",
  onTimeRangeChange,
  showTimeFilter = false,
  className,
  children,
  action,
}: DashboardWidgetProps) {
  return (
    <Card className={cn(
      "bg-card border border-border rounded-md shadow-card transition-shadow duration-150 hover:shadow-card-hover",
      className
    )}>
      <CardHeader className="px-4 py-4 md:px-6 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {showTimeFilter && onTimeRangeChange && (
              <div className="time-filter">
                {(["today", "week", "month"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => onTimeRangeChange(range)}
                    className={cn(
                      "time-filter-button",
                      timeRange === range && "active"
                    )}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            )}
            {action}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 md:px-6">
        {children}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, change, icon, className }: MetricCardProps) {
  return (
    <Card className={cn(
      "bg-card border border-border rounded-md shadow-card p-4",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="widget-metric-label">{label}</p>
          <p className="widget-metric">{value}</p>
          {change && (
            <p className={cn("widget-metric-change", change.type)}>
              {change.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <Card className={cn("bg-card border border-border rounded-md shadow-card p-4 md:p-6", className)}>
      <div className="space-y-4">
        <div className="skeleton h-5 w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - i * 15}%` }} />
          ))}
        </div>
      </div>
    </Card>
  );
}
