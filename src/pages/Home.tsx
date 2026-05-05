import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardWidget, MetricCard } from "@/components/ui/DashboardWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { NewsTicker } from "@/components/dashboard/NewsTicker";
import { AIBriefCard } from "@/components/ai/AIBriefCard";
import { supabase } from "@/integrations/supabase/client";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import {
  CalendarDays,
  DollarSign,
  Mail,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Target,
  Inbox,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { format: formatMoney } = useUserCurrency();

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayEnd = useMemo(() => endOfDay(new Date()), []);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(new Date()), []);
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  // Today's events
  const { data: todayEvents = [] } = useCalendarEvents(todayStart, todayEnd);

  // Tasks due today / open
  const { data: tasks = [] } = useQuery({
    queryKey: ["home-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("user_id", user.id)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      return data ?? [];
    },
  });

  // Goals - active
  const { data: goals = [] } = useQuery({
    queryKey: ["home-goals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("goals")
        .select("id, title, progress, category, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const emails: any[] = [];

  // Chats - recent messages
  const { data: chats = [] } = useQuery({
    queryKey: ["home-chats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("id, content, sender_name, channel_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  // Finance - this month transactions for spend metrics
  const { data: txns = [] } = useQuery({
    queryKey: ["home-finance", monthStart.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("financial_transactions")
        .select("id, amount, type, date, category")
        .eq("user_id", user.id)
        .gte("date", monthStart.getTime())
        .lte("date", monthEnd.getTime());
      return data ?? [];
    },
  });

  const financeMetrics = useMemo(() => {
    const isExpense = (t: any) => {
      const v = String(t.type || "").toLowerCase();
      return v.includes("expense") || v.includes("debit") || v.includes("out");
    };
    const today = todayStart.getTime();
    const tomorrow = todayEnd.getTime();
    const wkS = weekStart.getTime();
    const wkE = weekEnd.getTime();

    let spendToday = 0,
      spendWeek = 0,
      spendMonth = 0;
    for (const t of txns) {
      if (!isExpense(t)) continue;
      const amt = Math.abs(Number(t.amount) || 0);
      const d = Number(t.date);
      spendMonth += amt;
      if (d >= wkS && d <= wkE) spendWeek += amt;
      if (d >= today && d <= tomorrow) spendToday += amt;
    }
    return { spendToday, spendWeek, spendMonth };
  }, [txns, todayStart, todayEnd, weekStart, weekEnd]);

  const tasksDueToday = useMemo(
    () =>
      tasks.filter((t: any) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date).getTime();
        return d >= todayStart.getTime() && d <= todayEnd.getTime();
      }).length,
    [tasks, todayStart, todayEnd],
  );

  

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Today" />

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
              <div className="mb-4 sm:mb-6">
                <NewsTicker />
              </div>

              <div className="mb-4 sm:mb-6">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4 mb-4 sm:mb-6">
                <MetricCard
                  label="Events today"
                  value={String(todayEvents.length)}
                  change={{ value: todayEvents.length ? "Scheduled" : "Free day", type: "neutral" }}
                  icon={<CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
                <MetricCard
                  label="Open tasks"
                  value={String(tasks.length)}
                  change={{ value: `${tasksDueToday} due today`, type: tasksDueToday > 0 ? "negative" : "positive" }}
                  icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
                <MetricCard
                  label="Spend today"
                  value={formatMoney(financeMetrics.spendToday)}
                  change={{
                    value: `${formatMoney(financeMetrics.spendMonth)} mo`,
                    type: "neutral",
                  }}
                  icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
                <MetricCard
                  label="Listener"
                  value={String(emails.length)}
                  change={{ value: "Social Listener", type: "neutral" }}
                  icon={<Inbox className="h-4 w-4 sm:h-5 sm:w-5" />}
                />
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-6">
                {/* Today's Events */}
                <DashboardWidget
                  title="Today's Events"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/calendar")}>
                      View All
                    </Button>
                  }
                >
                  {todayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No events scheduled today.</p>
                  ) : (
                    <div className="space-y-3">
                      {todayEvents.slice(0, 5).map((event: any) => (
                        <div
                          key={event.id}
                          onClick={() => navigate("/calendar")}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.all_day ? "All day" : format(new Date(event.start_time), "h:mm a")}
                              </p>
                            </div>
                          </div>
                          {event.sync_source && (
                            <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                              {event.sync_source === "google" ? "Google" : "Local"}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Tasks */}
                <DashboardWidget
                  title="Open Tasks"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/tasks")}>
                      View All
                    </Button>
                  }
                >
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No open tasks. 🎉</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task: any) => (
                        <div
                          key={task.id}
                          onClick={() => navigate("/tasks")}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.due_date ? `Due ${format(new Date(task.due_date), "MMM d")}` : "No due date"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs shrink-0 ml-2">
                            {task.priority || "medium"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Goals */}
                <DashboardWidget
                  title="Active Goals"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/goals")}>
                      View All
                    </Button>
                  }
                >
                  {goals.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No active goals yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {goals.map((goal: any) => (
                        <div
                          key={goal.id}
                          onClick={() => navigate("/goals")}
                          className="cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <Target className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm font-medium truncate">{goal.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">{goal.progress ?? 0}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(100, goal.progress ?? 0)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Finance Snapshot */}
                <DashboardWidget
                  title="Finance Snapshot"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/finances")}>
                      View All
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Today's spending</span>
                      <span className="text-sm font-medium">{formatMoney(financeMetrics.spendToday)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This week</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{formatMoney(financeMetrics.spendWeek)}</span>
                        {financeMetrics.spendWeek > 0 ? (
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-success" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This month</span>
                      <span className="text-sm font-medium">{formatMoney(financeMetrics.spendMonth)}</span>
                    </div>
                    {txns.length === 0 && (
                      <p className="text-xs text-muted-foreground">No transactions recorded this month.</p>
                    )}
                  </div>
                </DashboardWidget>

                {/* Inbox Preview */}
                <DashboardWidget
                  title="Inbox"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/mail")}>
                      Open Mail
                    </Button>
                  }
                >
                  {emails.length === 0 ? (
                    <div className="py-4 text-center">
                      <Inbox className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No emails yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emails.map((email: any) => {
                        const who = email.from_email || email.to_email || "Unknown";
                        return (
                          <div
                            key={email.id}
                            onClick={() => navigate("/mail")}
                            className="flex items-start gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs font-medium">{who.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium truncate">{who}</p>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {format(new Date(email.created_at), "MMM d")}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{email.subject || "(no subject)"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DashboardWidget>

                {/* Chats Preview */}
                <DashboardWidget
                  title="Recent Chats"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/chat")}>
                      Open Chat
                    </Button>
                  }
                >
                  {chats.length === 0 ? (
                    <div className="py-4 text-center">
                      <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chats.map((chat: any) => (
                        <div
                          key={chat.id}
                          onClick={() => navigate("/chat")}
                          className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-social/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-4 w-4 text-social" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{chat.sender_name}</p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {format(new Date(chat.created_at), "MMM d")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
