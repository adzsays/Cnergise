import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { AlertTriangle, Calendar, PiggyBank, Repeat, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Expense = {
  id: string;
  posted_on: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  category: string | null;
  account_name: string | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

const norm = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

export function SnoopInsights() {
  const navigate = useNavigate();
  const { transactions, balanceSheet } = useFinancialData();

  const { data: expenses = [] } = useQuery({
    queryKey: ["snoop-expenses-90d"],
    queryFn: async (): Promise<Expense[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data } = await supabase
        .from("actual_expenses")
        .select("id,posted_on,merchant,description,amount,category,account_name")
        .gte("posted_on", since.toISOString().slice(0, 10))
        .order("posted_on", { ascending: false })
        .limit(2000);
      return (data || []) as Expense[];
    },
    staleTime: 60_000,
  });

  // ---------- Safe-to-spend ----------
  const liquid = useMemo(
    () =>
      balanceSheet.bankAccounts
        .filter((a) => (a.category || "").toLowerCase() === "bank")
        .reduce((s, a) => s + a.balance, 0),
    [balanceSheet.bankAccounts]
  );

  const { nextPayday, upcomingBills, safeToSpend } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const incomes = transactions.filter((t: any) => t.type === "income");
    const expensesTx = transactions.filter((t: any) => t.type === "expense");

    // Find next income event (day-of-month based) — rough payday guess
    let nextPayday: Date | null = null;
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const hit = incomes.find((t: any) => {
        if (!t.date) return false;
        const txDate = new Date(Number(t.date));
        return txDate.getDate() === d.getDate();
      });
      if (hit && i > 0) {
        nextPayday = d;
        break;
      }
    }

    let billsUntilPayday = 0;
    if (nextPayday) {
      expensesTx.forEach((t: any) => {
        if (!t.date) return;
        const txDate = new Date(Number(t.date));
        const candidate = new Date(today.getFullYear(), today.getMonth(), txDate.getDate());
        if (candidate >= today && candidate <= nextPayday) {
          billsUntilPayday += Math.abs(Number(t.monthly) || Number(t.amount) || 0);
        }
      });
    }

    return {
      nextPayday,
      upcomingBills: billsUntilPayday,
      safeToSpend: Math.max(0, liquid - billsUntilPayday),
    };
  }, [transactions, liquid]);

  // ---------- Spending by category (this month) ----------
  const byCategory = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const d = new Date(e.posted_on);
      if (d.getMonth() === m && d.getFullYear() === y && e.amount < 0) {
        const k = e.category || "Other";
        map.set(k, (map.get(k) || 0) + Math.abs(e.amount));
      }
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenses]);

  // ---------- Top merchants this vs last month ----------
  const merchantDelta = useMemo(() => {
    const now = new Date();
    const thisM = now.getMonth();
    const lastM = (thisM - 1 + 12) % 12;
    const lastY = thisM === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const thisMap = new Map<string, number>();
    const lastMap = new Map<string, number>();
    expenses.forEach((e) => {
      if (e.amount >= 0) return;
      const d = new Date(e.posted_on);
      const key = norm(e.merchant || e.description || "unknown") || "unknown";
      if (d.getMonth() === thisM && d.getFullYear() === now.getFullYear()) {
        thisMap.set(key, (thisMap.get(key) || 0) + Math.abs(e.amount));
      } else if (d.getMonth() === lastM && d.getFullYear() === lastY) {
        lastMap.set(key, (lastMap.get(key) || 0) + Math.abs(e.amount));
      }
    });
    return [...thisMap.entries()]
      .map(([name, value]) => ({ name, value, last: lastMap.get(name) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);

  // ---------- Recurring subscriptions ----------
  const recurring = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    expenses.forEach((e) => {
      if (e.amount >= 0) return;
      const key = norm(e.merchant || e.description || "");
      if (!key) return;
      const arr = groups.get(key) || [];
      arr.push(e);
      groups.set(key, arr);
    });
    const out: { name: string; amount: number; count: number; next: string | null }[] = [];
    groups.forEach((arr, key) => {
      if (arr.length < 3) return;
      const amounts = arr.map((a) => Math.abs(a.amount));
      const avg = amounts.reduce((s, n) => s + n, 0) / amounts.length;
      const stdev = Math.sqrt(amounts.reduce((s, n) => s + (n - avg) ** 2, 0) / amounts.length);
      if (stdev / avg > 0.25) return; // too variable, not a subscription
      // Check approx monthly cadence
      const dates = arr.map((a) => new Date(a.posted_on).getTime()).sort((a, b) => a - b);
      const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / (1000 * 60 * 60 * 24));
      const avgGap = gaps.reduce((s, n) => s + n, 0) / gaps.length;
      if (avgGap < 20 || avgGap > 40) return;
      const last = new Date(dates[dates.length - 1]);
      const next = new Date(last);
      next.setDate(next.getDate() + Math.round(avgGap));
      out.push({
        name: (arr[0].merchant || arr[0].description || key).slice(0, 40),
        amount: avg,
        count: arr.length,
        next: next.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      });
    });
    return out.sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [expenses]);

  const recurringMonthly = recurring.reduce((s, r) => s + r.amount, 0);

  // ---------- Smart insights ----------
  const insights = useMemo(() => {
    const out: { tone: "warn" | "info" | "good"; text: string; action?: () => void }[] = [];

    // Category delta vs last month
    const now = new Date();
    const thisM = now.getMonth();
    const lastM = (thisM - 1 + 12) % 12;
    const lastY = thisM === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const cat = (range: "this" | "last") => {
      const map = new Map<string, number>();
      expenses.forEach((e) => {
        if (e.amount >= 0) return;
        const d = new Date(e.posted_on);
        if (range === "this" && d.getMonth() === thisM && d.getFullYear() === now.getFullYear()) {
          const k = e.category || "Other";
          map.set(k, (map.get(k) || 0) + Math.abs(e.amount));
        } else if (range === "last" && d.getMonth() === lastM && d.getFullYear() === lastY) {
          const k = e.category || "Other";
          map.set(k, (map.get(k) || 0) + Math.abs(e.amount));
        }
      });
      return map;
    };
    const tM = cat("this");
    const lM = cat("last");
    tM.forEach((v, k) => {
      const prev = lM.get(k) || 0;
      if (prev > 0 && v > prev * 1.25 && v > 50) {
        const pct = Math.round(((v - prev) / prev) * 100);
        out.push({ tone: "warn", text: `${k} spend up ${pct}% vs last month (${fmt(v)})` });
      } else if (prev > 0 && v < prev * 0.75) {
        const pct = Math.round(((prev - v) / prev) * 100);
        out.push({ tone: "good", text: `${k} spend down ${pct}% vs last month` });
      }
    });

    // Duplicate-charge detection
    const seen = new Map<string, Expense[]>();
    expenses.forEach((e) => {
      const k = `${norm(e.merchant || e.description || "")}|${Math.abs(e.amount).toFixed(2)}|${e.posted_on}`;
      const arr = seen.get(k) || [];
      arr.push(e);
      seen.set(k, arr);
    });
    seen.forEach((arr) => {
      if (arr.length >= 2 && Math.abs(arr[0].amount) > 5) {
        out.push({
          tone: "warn",
          text: `Possible duplicate: ${arr[0].merchant || arr[0].description} ${fmt(Math.abs(arr[0].amount))} ×${arr.length} on ${new Date(arr[0].posted_on).toLocaleDateString("en-GB")}`,
        });
      }
    });

    return out.slice(0, 5);
  }, [expenses]);

  const topCatMax = byCategory[0]?.value || 1;

  return (
    <div className="space-y-4">
      {/* Safe-to-spend */}
      <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5" /> Safe to spend
            </div>
            <p className="text-3xl font-bold mt-1">{fmt(safeToSpend)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {nextPayday
                ? `Until next income on ${nextPayday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : "Add recurring income to enable payday tracking"}
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <div><span className="text-muted-foreground">Cash</span> <span className="font-semibold tabular-nums">{fmt(liquid)}</span></div>
            <div><span className="text-muted-foreground">Bills due</span> <span className="font-semibold tabular-nums text-expense">−{fmt(upcomingBills)}</span></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending by category */}
        <Card className="p-4">
          <h3 className="font-semibold mb-1">Spending by category</h3>
          <p className="text-xs text-muted-foreground mb-3">This month</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions imported yet</p>
          ) : (
            <div className="space-y-2">
              {byCategory.map((c) => (
                <button
                  key={c.name}
                  onClick={() => navigate(`/finances?view=expenses&category=${encodeURIComponent(c.name)}`)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate group-hover:text-primary">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">{fmt(c.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(c.value / topCatMax) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Top merchants */}
        <Card className="p-4">
          <h3 className="font-semibold mb-1">Top merchants</h3>
          <p className="text-xs text-muted-foreground mb-3">This month vs last</p>
          {merchantDelta.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No merchants found</p>
          ) : (
            <div className="space-y-2.5">
              {merchantDelta.map((m) => {
                const delta = m.value - m.last;
                const up = delta > 0;
                return (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span className="truncate capitalize">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{fmt(m.value)}</span>
                      {m.last > 0 && (
                        <Badge variant={up ? "destructive" : "secondary"} className="text-[10px] gap-0.5">
                          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(Math.round((delta / m.last) * 100))}%
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recurring subscriptions */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-1.5"><Repeat className="h-4 w-4" />Recurring subscriptions</h3>
            <p className="text-xs text-muted-foreground">Detected from your bank transactions</p>
          </div>
          {recurring.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Monthly total</p>
              <p className="text-lg font-semibold tabular-nums">{fmt(recurringMonthly)}</p>
            </div>
          )}
        </div>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recurring charges detected yet — import 90+ days of transactions</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recurring.map((r) => (
              <div key={r.name} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate capitalize">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Next: {r.next} · {r.count} charges
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{fmt(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Smart insights */}
      {insights.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-1.5 mb-3"><Sparkles className="h-4 w-4 text-primary" />Smart insights</h3>
          <div className="space-y-2">
            {insights.map((i, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${
                  i.tone === "warn"
                    ? "bg-destructive/5 border border-destructive/20"
                    : i.tone === "good"
                    ? "bg-emerald-500/5 border border-emerald-500/20"
                    : "bg-muted"
                }`}
              >
                {i.tone === "warn" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                ) : i.tone === "good" ? (
                  <TrendingDown className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                )}
                <span>{i.text}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default SnoopInsights;
