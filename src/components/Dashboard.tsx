
import React from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MoreHorizontal,
  Users,
} from "lucide-react";

export function Dashboard() {
  // Mock statistics data
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

  // Mock activities data
  const activities = [
    {
      id: 1,
      user: "You",
      action: "completed task",
      subject: "Update project timeline",
      time: "5 minutes ago",
    },
    {
      id: 2,
      user: "Sarah",
      action: "commented on",
      subject: "Client presentation deck",
      time: "1 hour ago",
    },
    {
      id: 3,
      user: "John",
      action: "assigned you to",
      subject: "Review marketing materials",
      time: "3 hours ago",
    },
    {
      id: 4,
      user: "Finance app",
      action: "updated",
      subject: "Monthly budget overview",
      time: "Yesterday, 5:30 PM",
    },
  ];

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: "Team Weekly Sync",
      time: "Today, 10:00 AM",
      duration: "1 hour",
      participants: 8,
    },
    {
      id: 2,
      title: "Client Presentation: Project Phase 2",
      time: "Tomorrow, 2:00 PM",
      duration: "45 minutes",
      participants: 5,
    },
    {
      id: 3,
      title: "Budget Review Meeting",
      time: "Friday, 11:30 AM",
      duration: "30 minutes",
      participants: 3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Cards */}
      <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <CustomCard key={index} className="p-0 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-white",
                    stat.color
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    stat.change.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : stat.change.startsWith("-")
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {stat.change !== "0" ? stat.change : "No change"}
                </Badge>
                <p className="text-xs text-muted-foreground ml-2">vs last week</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-muted overflow-hidden">
              <div
                className={cn("h-full", stat.color)}
                style={{ width: `${Math.random() * 50 + 50}%` }}
              ></div>
            </div>
          </CustomCard>
        ))}
      </div>

      {/* Main Content Column */}
      <div className="md:col-span-2 space-y-6">
        {/* Activity Feed */}
        <CustomCard title="Recent Activity">
          <div className="space-y-4">
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
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full">
              View All Activity
            </Button>
          </div>
        </CustomCard>

        {/* Goal Progress */}
        <CustomCard title="Monthly Goals">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Complete Project Milestones</p>
                  <p className="text-sm text-muted-foreground">
                    8/12 milestones completed
                  </p>
                </div>
                <Badge>67%</Badge>
              </div>
              <Progress value={67} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Financial Target</p>
                  <p className="text-sm text-muted-foreground">
                    $8,540 / $10,000 saved
                  </p>
                </div>
                <Badge>85%</Badge>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Health & Wellness</p>
                  <p className="text-sm text-muted-foreground">
                    15/20 workout sessions
                  </p>
                </div>
                <Badge>75%</Badge>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CustomCard>
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
        {/* Upcoming Events */}
        <CustomCard title="Upcoming Events">
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border flex items-start gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {event.time} · {event.duration}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {event.participants} participants
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CustomCard>

        {/* Platform Stats */}
        <CustomCard title="App Overview">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Tasks</span>
              </div>
              <span className="font-medium">24</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email Accounts</span>
              </div>
              <span className="font-medium">3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Calendars Synced</span>
              </div>
              <span className="font-medium">2</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Financial Accounts</span>
              </div>
              <span className="font-medium">3</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            Manage Connections
          </Button>
        </CustomCard>
      </div>
    </div>
  );
}
