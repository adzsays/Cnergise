
import React from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Mail,
  Users,
  ArrowUpRight,
} from "lucide-react";

export function StatsSidebar() {
  // Statistics data
  const statsData = [
    {
      title: "Total Tasks",
      value: "24",
      icon: CheckCircle2,
      change: "+5",
      color: "bg-blue-500",
    },
    {
      title: "Upcoming Meetings",
      value: "7",
      icon: Calendar,
      change: "+2",
      color: "bg-purple-500",
    },
    {
      title: "Unread Emails",
      value: "12",
      icon: Mail,
      change: "-3",
      color: "bg-orange-500",
    },
    {
      title: "Team Members",
      value: "8",
      icon: Users,
      change: "0",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Quick Stats</h3>
      
      {statsData.map((stat, index) => (
        <CustomCard key={index} className="p-0 overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-white",
                    stat.color
                  )}
                >
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center">
                    <h3 className="text-base font-bold">{stat.value}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium ml-2",
                        stat.change.startsWith("+")
                          ? "text-green-600 dark:text-green-400"
                          : stat.change.startsWith("-")
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {stat.change !== "0" ? stat.change : "="}
                    </Badge>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <div className="h-1 w-full bg-muted overflow-hidden">
            <div
              className={cn("h-full", stat.color)}
              style={{ width: `${Math.random() * 50 + 50}%` }}
            ></div>
          </div>
        </CustomCard>
      ))}

      {/* Add mini calendar preview */}
      <CustomCard title="Today's Schedule" className="text-xs">
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1 border-b">
            <div>
              <p className="font-medium">Team Standup</p>
              <p className="text-muted-foreground">10:00 AM - 10:30 AM</p>
            </div>
            <Badge variant="outline" className="text-xs">30m</Badge>
          </div>
          <div className="flex justify-between items-center py-1 border-b">
            <div>
              <p className="font-medium">Client Call</p>
              <p className="text-muted-foreground">1:00 PM - 2:00 PM</p>
            </div>
            <Badge variant="outline" className="text-xs">1h</Badge>
          </div>
          <div className="flex justify-between items-center py-1">
            <div>
              <p className="font-medium">Project Review</p>
              <p className="text-muted-foreground">4:30 PM - 5:00 PM</p>
            </div>
            <Badge variant="outline" className="text-xs">30m</Badge>
          </div>
        </div>
      </CustomCard>

      {/* Quick task summary */}
      <CustomCard title="Priority Tasks" className="text-xs">
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1 border-b">
            <p className="font-medium truncate">Finalize design proposal</p>
            <Badge variant="outline" className="text-xs bg-red-100 text-red-800">High</Badge>
          </div>
          <div className="flex justify-between items-center py-1 border-b">
            <p className="font-medium truncate">Review marketing assets</p>
            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">Medium</Badge>
          </div>
          <div className="flex justify-between items-center py-1">
            <p className="font-medium truncate">Update project timeline</p>
            <Badge variant="outline" className="text-xs bg-red-100 text-red-800">High</Badge>
          </div>
        </div>
      </CustomCard>
    </div>
  );
}
