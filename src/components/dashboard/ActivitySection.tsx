
import React from "react";
import { Button } from "@/components/ui/button";
import { Bell, MoreHorizontal } from "lucide-react";

interface ActivitySectionProps {
  projectFilter: string;
}

export function ActivitySection({ projectFilter }: ActivitySectionProps) {
  // Mock activities data with project associations
  const allActivities = [
    {
      id: 1,
      user: "You",
      action: "completed task",
      subject: "Update project timeline",
      time: "5 minutes ago",
      projectId: "website",
    },
    {
      id: 2,
      user: "Sarah",
      action: "commented on",
      subject: "Client presentation deck",
      time: "1 hour ago",
      projectId: "website",
    },
    {
      id: 3,
      user: "John",
      action: "assigned you to",
      subject: "Review marketing materials",
      time: "3 hours ago",
      projectId: "marketing",
    },
    {
      id: 4,
      user: "Finance app",
      action: "updated",
      subject: "Monthly budget overview",
      time: "Yesterday, 5:30 PM",
      projectId: "mobile",
    },
    {
      id: 5,
      user: "DevOps",
      action: "deployed",
      subject: "API version 2.1",
      time: "Yesterday, 2:00 PM",
      projectId: "mobile",
    },
  ];

  // Filter activities by project if needed
  const activities = projectFilter === "all" 
    ? allActivities 
    : allActivities.filter(activity => activity.projectId === projectFilter);

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        <>
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  {activity.action}{" "}
                  <span className="font-medium">{activity.subject}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Activity
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No activity found for the selected project.
        </div>
      )}
    </div>
  );
}
