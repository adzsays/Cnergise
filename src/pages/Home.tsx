
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardWidget, MetricCard } from "@/components/ui/DashboardWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { NewsTicker } from "@/components/dashboard/NewsTicker";
import {
  CalendarDays,
  Heart,
  DollarSign,
  Mail,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Activity,
  Moon,
} from "lucide-react";
import { format } from "date-fns";

const Index = () => {
  // Mock data
  const upcomingEvents = [
    { id: 1, title: "Team standup", time: "09:00 AM", type: "meeting" },
    { id: 2, title: "Dentist appointment", time: "11:30 AM", type: "personal" },
    { id: 3, title: "Project review", time: "02:00 PM", type: "meeting" },
  ];

  const unreadEmails = [
    { id: 1, from: "John Smith", subject: "Q4 Budget Review", time: "10 min ago" },
    { id: 2, from: "Sarah Connor", subject: "Meeting reschedule", time: "1 hour ago" },
  ];

  const recentChats = [
    { id: 1, name: "Design Team", message: "New mockups ready for review", unread: 3 },
    { id: 2, name: "Mike Johnson", message: "Thanks for the update!", unread: 0 },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Today" />

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
              {/* News Ticker */}
              <div className="mb-4 sm:mb-6">
                <NewsTicker />
              </div>

              {/* Date header */}
              <div className="mb-4 sm:mb-6">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              {/* Key metrics row - 2x2 grid on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4 mb-4 sm:mb-6">
                <MetricCard
                  label="Steps"
                  value="6,432"
                  change={{ value: "+12%", type: "positive" }}
                  icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
                <MetricCard
                  label="Sleep"
                  value="7h 24m"
                  change={{ value: "Good", type: "positive" }}
                  icon={<Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
                <MetricCard
                  label="Spend"
                  value="£42.50"
                  change={{ value: "On track", type: "positive" }}
                  icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
                <MetricCard
                  label="Unread"
                  value="5"
                  change={{ value: "2 urgent", type: "neutral" }}
                  icon={<Mail className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-6">
                {/* Calendar Events */}
                <DashboardWidget
                  title="Upcoming Events"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View All
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.time}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </DashboardWidget>

                {/* Health Summary */}
                <DashboardWidget
                  title="Health Summary"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Details
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-health" />
                        <span className="text-sm">Resting HR</span>
                      </div>
                      <span className="text-sm font-medium">62 bpm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-health" />
                        <span className="text-sm">Active calories</span>
                      </div>
                      <span className="text-sm font-medium">324 kcal</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-health h-2 rounded-full transition-all"
                        style={{ width: "65%" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      65% of daily move goal
                    </p>
                  </div>
                </DashboardWidget>

                {/* Finance Snapshot */}
                <DashboardWidget
                  title="Finance Snapshot"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View All
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Today's spending</span>
                      <span className="text-sm font-medium">£42.50</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This week</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">£312.80</span>
                        <TrendingDown className="h-3 w-3 text-success" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly budget</span>
                      <span className="text-sm font-medium">£1,247 / £2,000</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full transition-all"
                        style={{ width: "62%" }}
                      />
                    </div>
                  </div>
                </DashboardWidget>

                {/* Inbox Preview */}
                <DashboardWidget
                  title="Inbox"
                  action={
                    <Badge variant="secondary" className="text-xs">
                      2 unread
                    </Badge>
                  }
                >
                  <div className="space-y-3">
                    {unreadEmails.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-start gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium">
                            {email.from.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{email.from}</p>
                            <span className="text-xs text-muted-foreground">{email.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {email.subject}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DashboardWidget>

                {/* Chats Preview */}
                <DashboardWidget
                  title="Recent Chats"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Open Chat
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {recentChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-social/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-4 w-4 text-social" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{chat.name}</p>
                            {chat.unread > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {chat.unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DashboardWidget>
              </div>
            </main>
          </div>
        </SidebarInset>
        <VoiceAssistant />
      </div>
    </SidebarProvider>
  );
};

export default Index;
