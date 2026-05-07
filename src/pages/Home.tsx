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
import { CrossDataAssistant } from "@/components/ai/CrossDataAssistant";
import { NewsTicker } from "@/components/dashboard/NewsTicker";
import { FloatingAIBrief } from "@/components/ai/FloatingAIBrief";
import { supabase } from "@/integrations/supabase/client";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import {
  CalendarDays,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle2,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  LineChart,
  FileText,
  Clock,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, addDays, differenceInDays, isToday } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { format: formatMoney } = useUserCurrency();

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayEnd = useMemo(() => endOfDay(new Date()), []);
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);
  const next14End = useMemo(() => endOfDay(addDays(new Date(), 14)), []);

  // Today's events
  const { data: todayEventsRaw = [] } = useCalendarEvents(todayStart, todayEnd);
  const todayEvents = useMemo(() => {
    const now = Date.now();
    return todayEventsRaw.filter((e: any) => {
      if (e.all_day) return true;
      const end = e.end_time ? new Date(e.end_time).getTime() : new Date(e.start_time).getTime();
      return end >= now;
    });
  }, [todayEventsRaw]);

  // Upcoming events (next 14 days) — used when no events today
  const { data: upcomingEvents = [] } = useCalendarEvents(addDays(todayEnd, 0), next14End);
  const futureEvents = useMemo(
    () => upcomingEvents.filter((e: any) => new Date(e.start_time).getTime() > todayEnd.getTime()).slice(0, 5),
    [upcomingEvents, todayEnd],
  );

  // Tasks
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

  // Goals
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

  const tradingGoals = useMemo(
    () => goals.filter((g: any) => /trad|invest|portfolio|market/i.test(`${g.category} ${g.title}`)),
    [goals],
  );

  // Recurring transactions — to project upcoming income & payments
  const { data: recurringTxns = [] } = useQuery({
    queryKey: ["home-recurring"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("financial_transactions")
        .select("id, category, subcategory, amount, monthly, type, frequency, start_date, end_date")
        .eq("user_id", user.id)
        .neq("frequency", "one-time")
        .not("frequency", "is", null);
      return data ?? [];
    },
  });

  // This-month transactions for spend metrics
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

  // Outstanding invoices (chasers)
  const { data: outstandingInvoices = [] } = useQuery({
    queryKey: ["home-invoices-outstanding"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_name, total, balance_due, due_date, status, currency")
        .eq("user_id", user.id)
        .not("status", "in", "(paid,void,draft)")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(10);
      return data ?? [];
    },
  });

  // Latest health metric
  const { data: lastHealth } = useQuery({
    queryKey: ["home-health-latest"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("health_metrics")
        .select("metric_date, source, steps, sleep_minutes")
        .eq("user_id", user.id)
        .order("metric_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Trading signals — recent
  const { data: tradeSignals = [] } = useQuery({
    queryKey: ["home-trade-signals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("ai_trade_signals")
        .select("id, symbol, side, conviction, status, generated_at, rationale")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  // Strategy momentum — last 2 snapshots per strategy to detect winning/losing
  const { data: stratSnapshots = [] } = useQuery({
    queryKey: ["home-strategy-momentum"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("strategy_performance_snapshots")
        .select("strategy_id, snapshot_date, return_pct, cumulative_return_pct, win_rate_pct, max_drawdown_pct")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: false })
        .limit(40);
      return data ?? [];
    },
  });

  // ───── derived ─────
  const isExpense = (t: any) => /expense|debit|out/i.test(String(t.type || ""));
  const isIncome = (t: any) => /income|credit|in/i.test(String(t.type || ""));

  const financeMetrics = useMemo(() => {
    const today = todayStart.getTime();
    const tomorrow = todayEnd.getTime();
    let spendToday = 0,
      spendMonth = 0;
    for (const t of txns) {
      if (!isExpense(t)) continue;
      const amt = Math.abs(Number(t.amount) || 0);
      const d = Number(t.date);
      spendMonth += amt;
      if (d >= today && d <= tomorrow) spendToday += amt;
    }
    return { spendToday, spendMonth };
  }, [txns, todayStart, todayEnd]);

  // Project next 14 days of recurring payments & income
  const upcomingCashflow = useMemo(() => {
    const now = new Date();
    const horizon = addDays(now, 14);
    const items: Array<{ id: string; date: Date; amount: number; label: string; kind: "income" | "expense" }> = [];

    const addOccurrences = (t: any) => {
      if (!t.start_date) return;
      const start = new Date(t.start_date);
      const end = t.end_date ? new Date(t.end_date) : null;
      const amount = Math.abs(Number(t.monthly ?? t.amount) || 0);
      const kind: "income" | "expense" = isIncome(t) ? "income" : "expense";
      const label = t.subcategory || t.category || "Recurring";
      const stepDays =
        t.frequency === "daily" ? 1 :
        t.frequency === "weekly" ? 7 :
        t.frequency === "monthly" ? 30 :
        t.frequency === "quarterly" ? 91 :
        t.frequency === "yearly" ? 365 : 0;
      if (!stepDays) return;

      // walk forward from start_date until we land in [now, horizon]
      let cur = new Date(start);
      let guard = 0;
      while (cur < now && guard++ < 400) cur = addDays(cur, stepDays);
      while (cur <= horizon && guard++ < 50) {
        if (end && cur > end) break;
        items.push({ id: `${t.id}-${cur.getTime()}`, date: new Date(cur), amount, label, kind });
        cur = addDays(cur, stepDays);
      }
    };

    recurringTxns.forEach(addOccurrences);
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8);
  }, [recurringTxns]);

  const upcomingPayments = upcomingCashflow.filter((c) => c.kind === "expense");
  const upcomingIncome = upcomingCashflow.filter((c) => c.kind === "income");

  const overdueInvoices = useMemo(
    () =>
      outstandingInvoices.filter((i: any) => {
        if (!i.due_date) return false;
        return new Date(i.due_date) < todayStart;
      }),
    [outstandingInvoices, todayStart],
  );

  const tasksDueToday = useMemo(
    () =>
      tasks.filter((t: any) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date).getTime();
        return d >= todayStart.getTime() && d <= todayEnd.getTime();
      }).length,
    [tasks, todayStart, todayEnd],
  );

  // Health staleness
  const healthDaysAgo = lastHealth?.metric_date ? differenceInDays(todayStart, new Date(lastHealth.metric_date)) : null;
  const healthStale = healthDaysAgo == null || healthDaysAgo >= 7;

  // Strategy momentum aggregation: per-strategy last 2 snapshots → trend
  const strategyMomentum = useMemo(() => {
    const byStrat: Record<string, any[]> = {};
    for (const s of stratSnapshots) {
      if (!s.strategy_id) continue;
      (byStrat[s.strategy_id] ||= []).push(s);
    }
    const rows: Array<{ id: string; latest: any; trend: "up" | "down" | "flat"; delta: number }> = [];
    for (const [id, arr] of Object.entries(byStrat)) {
      const sorted = arr.sort((a, b) => (a.snapshot_date < b.snapshot_date ? 1 : -1));
      const latest = sorted[0];
      const prev = sorted[1];
      const a = Number(latest?.cumulative_return_pct ?? 0);
      const b = Number(prev?.cumulative_return_pct ?? 0);
      const delta = a - b;
      rows.push({ id, latest, delta, trend: delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat" });
    }
    return rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)).slice(0, 4);
  }, [stratSnapshots]);

  const eventsCardEvents = todayEvents.length ? todayEvents : futureEvents;
  const eventsCardTitle = todayEvents.length ? "Today's events" : "Upcoming events";

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
                <button onClick={() => navigate("/calendar")} className="text-left">
                  <MetricCard
                    label="Events today"
                    value={String(todayEvents.length)}
                    change={{ value: todayEvents.length ? "Scheduled" : `${futureEvents.length} upcoming`, type: "neutral" }}
                    icon={<CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />}
                  />
                </button>
                <button onClick={() => navigate("/tasks?tab=tasks")} className="text-left">
                  <MetricCard
                    label="Open tasks"
                    value={String(tasks.length)}
                    change={{ value: `${tasksDueToday} due today`, type: tasksDueToday > 0 ? "negative" : "positive" }}
                    icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                  />
                </button>
                <button onClick={() => navigate("/finances?tab=expenses")} className="text-left">
                  <MetricCard
                    label="Spend today"
                    value={formatMoney(financeMetrics.spendToday)}
                    change={{ value: `${formatMoney(financeMetrics.spendMonth)} mo`, type: "neutral" }}
                    icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                  />
                </button>
                <button onClick={() => navigate("/finances?tab=invoices&subtab=list")} className="text-left">
                  <MetricCard
                    label="Overdue invoices"
                    value={String(overdueInvoices.length)}
                    change={{ value: overdueInvoices.length ? "Send chasers" : "All on track", type: overdueInvoices.length ? "negative" : "positive" }}
                    icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-6">
                {/* Events */}
                <DashboardWidget
                  title={eventsCardTitle}
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/calendar")}>
                      Open calendar
                    </Button>
                  }
                >
                  {eventsCardEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nothing scheduled in the next 14 days.</p>
                  ) : (
                    <div className="space-y-3">
                      {eventsCardEvents.slice(0, 5).map((event: any) => (
                        <button
                          key={event.id}
                          onClick={() => navigate("/calendar")}
                          className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.all_day
                                  ? format(new Date(event.start_time), "MMM d")
                                  : `${isToday(new Date(event.start_time)) ? "Today" : format(new Date(event.start_time), "MMM d")} · ${format(new Date(event.start_time), "h:mm a")}`}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Upcoming Payments */}
                <DashboardWidget
                  title="Upcoming payments"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/finances?tab=cashflow")}>
                      Cash flow
                    </Button>
                  }
                >
                  {upcomingPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No recurring payments in the next 14 days.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingPayments.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate("/finances?tab=cashflow")}
                          className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ArrowDownCircle className="h-4 w-4 text-destructive shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.label}</p>
                              <p className="text-xs text-muted-foreground">{format(p.date, "EEE MMM d")}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium tabular-nums">{formatMoney(p.amount)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Upcoming Income */}
                <DashboardWidget
                  title="Upcoming income"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/finances?tab=cashflow")}>
                      Cash flow
                    </Button>
                  }
                >
                  {upcomingIncome.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No recurring income scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingIncome.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate("/finances?tab=cashflow")}
                          className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ArrowUpCircle className="h-4 w-4 text-success shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.label}</p>
                              <p className="text-xs text-muted-foreground">{format(p.date, "EEE MMM d")}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium tabular-nums">{formatMoney(p.amount)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Invoice chasers */}
                <DashboardWidget
                  title="Invoice chasers"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/finances?tab=invoices")}>
                      All invoices
                    </Button>
                  }
                >
                  {outstandingInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No outstanding invoices.</p>
                  ) : (
                    <div className="space-y-3">
                      {outstandingInvoices.slice(0, 5).map((inv: any) => {
                        const overdue = inv.due_date && new Date(inv.due_date) < todayStart;
                        return (
                          <button
                            key={inv.id}
                            onClick={() => navigate("/finances?tab=invoices")}
                            className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {inv.invoice_number} · {inv.client_name ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {inv.due_date ? `Due ${format(new Date(inv.due_date), "MMM d")}` : "No due date"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-medium tabular-nums">{formatMoney(Number(inv.balance_due ?? 0))}</span>
                              {overdue && <Badge variant="destructive" className="text-[10px]">Chase</Badge>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </DashboardWidget>

                {/* Open tasks */}
                <DashboardWidget
                  title="Open tasks"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/tasks?tab=tasks")}>
                      View all
                    </Button>
                  }
                >
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No open tasks. 🎉</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task: any) => (
                        <button
                          key={task.id}
                          onClick={() => navigate("/tasks?tab=tasks")}
                          className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
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
                        </button>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Trading goals */}
                <DashboardWidget
                  title="Trading goals"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/goals")}>
                      All goals
                    </Button>
                  }
                >
                  {tradingGoals.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No active trading goals.</p>
                  ) : (
                    <div className="space-y-4">
                      {tradingGoals.map((goal: any) => (
                        <button
                          key={goal.id}
                          onClick={() => navigate("/goals")}
                          className="w-full text-left hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
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
                        </button>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Trade signals & strategy momentum */}
                <DashboardWidget
                  title="Strategy signals & momentum"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/portfolio?tab=strategies")}>
                      Strategies
                    </Button>
                  }
                >
                  {tradeSignals.length === 0 && strategyMomentum.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No active signals or backtests.</p>
                  ) : (
                    <div className="space-y-3">
                      {tradeSignals.slice(0, 3).map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => navigate("/portfolio?tab=strategies")}
                          className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <LineChart className="h-4 w-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {s.symbol} · {String(s.side).toUpperCase()}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.conviction != null ? `Conviction ${Math.round(Number(s.conviction) * 100)}%` : "Signal"} · {format(new Date(s.generated_at), "MMM d")}
                              </p>
                            </div>
                          </div>
                          <Badge variant={s.status === "new" ? "default" : "secondary"} className="text-[10px]">
                            {s.status}
                          </Badge>
                        </button>
                      ))}
                      {strategyMomentum.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => navigate("/portfolio?tab=bundles")}
                          className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {m.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-success shrink-0" />
                            ) : m.trend === "down" ? (
                              <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                            ) : (
                              <LineChart className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">Strategy momentum</p>
                              <p className="text-xs text-muted-foreground">
                                {m.delta >= 0 ? "+" : ""}
                                {m.delta.toFixed(2)}% vs last snapshot
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            {Number(m.latest?.cumulative_return_pct ?? 0).toFixed(1)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </DashboardWidget>

                {/* Health */}
                <DashboardWidget
                  title="Health check-in"
                  action={
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/health")}>
                      Open health
                    </Button>
                  }
                >
                  <button
                    onClick={() => navigate("/health")}
                    className="w-full text-left hover:bg-muted/50 -mx-2 px-2 py-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${healthStale ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                        {healthStale ? <AlertTriangle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        {lastHealth ? (
                          <>
                            <p className="text-sm font-medium">
                              Last sync {healthDaysAgo === 0 ? "today" : `${healthDaysAgo}d ago`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lastHealth.steps ? `${lastHealth.steps.toLocaleString()} steps` : "—"}
                              {lastHealth.sleep_minutes ? ` · ${(lastHealth.sleep_minutes / 60).toFixed(1)}h sleep` : ""}
                              {healthStale ? " · refresh recommended" : ""}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">No health data yet</p>
                            <p className="text-xs text-muted-foreground">Connect a source to start tracking.</p>
                          </>
                        )}
                      </div>
                    </div>
                    {healthStale && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Update at least weekly for accurate trends.</span>
                      </div>
                    )}
                  </button>
                </DashboardWidget>
              </div>
            </main>
          </div>
        </SidebarInset>
        <VoiceAssistant />
        <FloatingAIBrief scope="today" title="Today AI brief" />
        <CrossDataAssistant />
      </div>
    </SidebarProvider>
  );
};

export default Index;
