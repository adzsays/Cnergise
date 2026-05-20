import { useEffect, useMemo, useState } from 'react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp, Wallet, Target } from 'lucide-react';
import { SleekChart } from '@/components/ui/SleekChart';
import { SnoopInsights } from './SnoopInsights';
import { TableView } from './TableView';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly';
const PERIOD_LABEL: Record<Period, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

const COST_CENTRE_KEY = 'finance.costCentres.v1';
const DEFAULT_COST_CENTRES = ['Personal', 'Home', 'Work', 'Side Hustle', 'Investment', 'Other'];
const loadCostCentres = (): string[] => {
  try {
    const raw = localStorage.getItem(COST_CENTRE_KEY);
    if (!raw) return DEFAULT_COST_CENTRES;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_COST_CENTRES;
  } catch {
    return DEFAULT_COST_CENTRES;
  }
};

const FREQ_TO_MONTHLY: Record<string, number> = {
  'daily': 30, 'weekly': 52 / 12, 'fortnightly': 26 / 12, 'bi-weekly': 26 / 12,
  'biweekly': 26 / 12, 'monthly': 1, 'quarterly': 1 / 3, 'half-yearly': 1 / 6,
  'semi-annually': 1 / 6, 'yearly': 1 / 12, 'annually': 1 / 12,
  'one-time': 0, 'once': 0,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
const formatCompact = (n: number) => (Math.abs(n) >= 1000 ? `£${(n / 1000).toFixed(1)}k` : `£${Math.round(n)}`);

export function FinanceDashboardView() {
  const { transactions, balanceSheet } = useFinancialData();
  const [costCentre, setCostCentre] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('monthly');
  const [managedCostCentres, setManagedCostCentres] = useState<string[]>(loadCostCentres());

  useEffect(() => {
    const handler = () => setManagedCostCentres(loadCostCentres());
    window.addEventListener('cost-centres-changed', handler);
    return () => window.removeEventListener('cost-centres-changed', handler);
  }, []);

  const costCentres = useMemo(() => {
    const set = new Set<string>(managedCostCentres);
    transactions.forEach((t: any) => t.cost_centre && set.add(t.cost_centre));
    return Array.from(set);
  }, [managedCostCentres, transactions]);

  const liquidBankAccounts = useMemo(
    () => balanceSheet.bankAccounts.filter((a) => (a.category || '').toLowerCase() === 'bank'),
    [balanceSheet.bankAccounts]
  );
  const liquidCash = useMemo(
    () => liquidBankAccounts.reduce((s, a) => s + a.balance, 0),
    [liquidBankAccounts]
  );

  const filteredTx = useMemo(
    () =>
      costCentre === 'all'
        ? transactions
        : transactions.filter((t: any) => (t.cost_centre || '').toLowerCase() === costCentre.toLowerCase()),
    [transactions, costCentre]
  );

  // ===== Current-month daily series (Income vs Expense by day) =====
  const { dailyData, monthlyIncome, monthlyExpense, dailyAvgIncome, dailyAvgExpense, topExpenses, topIncomes } =
    useMemo(() => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const isActiveThisMonth = (t: any) => {
        if (t.start_date && new Date(t.start_date) > monthEnd) return false;
        if (t.end_date && new Date(t.end_date) < monthStart) return false;
        return true;
      };
      const toMonthly = (t: any) => {
        if (!isActiveThisMonth(t)) return 0;
        if (Array.isArray(t.projections) && t.projections.length > 0) {
          const first = Number(t.projections[0]) || 0;
          const varies = t.projections.some((p: any) => Math.abs((Number(p) || 0) - first) > 0.01);
          if (varies) return Math.abs(first);
        }
        const raw = Math.abs(Number(t.monthly) || Number(t.amount) || 0);
        const freq = (t.frequency || 'monthly').toLowerCase();
        const factor = FREQ_TO_MONTHLY[freq] ?? 1;
        return raw * factor;
      };

      const incomes = filteredTx.filter((t) => t.type === 'income');
      const expenses = filteredTx.filter((t) => t.type === 'expense');
      const monthlyIncome = incomes.reduce((s, t) => s + toMonthly(t), 0);
      const monthlyExpense = expenses.reduce((s, t) => s + toMonthly(t), 0);
      const dailyAvgIncome = monthlyIncome / daysInMonth;
      const dailyAvgExpense = monthlyExpense / daysInMonth;

      const dailySeries: { income: number; expense: number }[] = Array.from({ length: daysInMonth }, () => ({ income: 0, expense: 0 }));
      const placeOrSpread = (t: any, bucket: 'income' | 'expense') => {
        const amt = toMonthly(t);
        if (!amt) return;
        const day = t.date ? new Date(Number(t.date)).getDate() : 0;
        if (day >= 1 && day <= daysInMonth) {
          dailySeries[day - 1][bucket] += amt;
        } else {
          const per = amt / daysInMonth;
          for (let i = 0; i < daysInMonth; i++) dailySeries[i][bucket] += per;
        }
      };
      incomes.forEach((t) => placeOrSpread(t, 'income'));
      expenses.forEach((t) => placeOrSpread(t, 'expense'));

      const series = dailySeries.map((d, i) => ({
        day: i + 1,
        label: `${i + 1}`,
        income: Math.round(d.income),
        expense: Math.round(d.expense),
      }));

      const topExpenses = [...expenses]
        .map((t) => ({ name: t.subcategory || t.category, value: toMonthly(t), daily: toMonthly(t) / daysInMonth }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      const topIncomes = [...incomes]
        .map((t) => ({ name: t.subcategory || t.category, value: toMonthly(t), daily: toMonthly(t) / daysInMonth }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return { dailyData: series, monthlyIncome, monthlyExpense, dailyAvgIncome, dailyAvgExpense, topExpenses, topIncomes };
    }, [filteredTx]);

  const monthlyNet = monthlyIncome - monthlyExpense;
  const dailyNet = dailyAvgIncome - dailyAvgExpense;
  const savingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : 0;

  // ===== Forecast: daily occurrences over 12 months, aggregated by period =====
  const runningBalanceRows = useMemo(() => {
    const today = new Date();
    const horizonStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const horizonEnd = new Date(horizonStart.getFullYear(), horizonStart.getMonth() + 12, 0);
    const totalDays = Math.floor((horizonEnd.getTime() - horizonStart.getTime()) / 86400000) + 1;
    type Day = { date: Date; income: number; expense: number };
    const days: Day[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(horizonStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d, income: 0, expense: 0 });
    }
    const dayIndex = (d: Date) =>
      Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - horizonStart.getTime()) / 86400000);

    const addOccurrences = (t: any) => {
      const freq = (t.frequency || 'monthly').toLowerCase();
      const amount = Math.abs(Number(t.amount) || Number(t.monthly) || 0);
      if (!amount) return;
      const baseDate = t.date ? new Date(Number(t.date)) : new Date();
      const startBound = t.start_date ? new Date(t.start_date) : null;
      const endBound = t.end_date ? new Date(t.end_date) : null;
      const place = (d: Date) => {
        if (d < horizonStart || d > horizonEnd) return;
        if (startBound && d < startBound) return;
        if (endBound && d > endBound) return;
        const idx = dayIndex(d);
        if (idx < 0 || idx >= days.length) return;
        if (t.type === 'income') days[idx].income += amount;
        else if (t.type === 'expense') days[idx].expense += amount;
      };
      if (freq === 'one-time' || freq === 'once') { place(baseDate); return; }
      const step: { months?: number; days?: number } = (() => {
        switch (freq) {
          case 'daily': return { days: 1 };
          case 'weekly': return { days: 7 };
          case 'fortnightly': case 'bi-weekly': case 'biweekly': return { days: 14 };
          case 'monthly': return { months: 1 };
          case 'quarterly': return { months: 3 };
          case 'half-yearly': case 'semi-annually': return { months: 6 };
          case 'yearly': case 'annually': return { months: 12 };
          default: return { months: 1 };
        }
      })();
      let cursor = new Date(baseDate);
      while (cursor < horizonStart) {
        if (step.months) cursor.setMonth(cursor.getMonth() + step.months);
        else if (step.days) cursor.setDate(cursor.getDate() + step.days);
        else break;
      }
      let safety = 0;
      while (cursor <= horizonEnd && safety < 2000) {
        place(cursor);
        const next = new Date(cursor);
        if (step.months) next.setMonth(next.getMonth() + step.months);
        else if (step.days) next.setDate(next.getDate() + step.days);
        else break;
        cursor = next;
        safety++;
      }
    };
    filteredTx.forEach(addOccurrences);

    type Row = { label: string; income: number; expense: number; net: number; balance: number };
    const rows: Row[] = [];
    let running = liquidCash;
    const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

    if (period === 'daily') {
      const cap = Math.min(days.length, 90);
      for (let i = 0; i < cap; i++) {
        const day = days[i];
        running += day.income - day.expense;
        rows.push({ label: fmtDate(day.date), income: day.income, expense: day.expense, net: day.income - day.expense, balance: running });
      }
    } else if (period === 'weekly') {
      let bucketStart = days[0]?.date, bucketEnd: Date | null = null, inc = 0, exp = 0, count = 0;
      for (let i = 0; i < days.length; i++) {
        if (count === 0) bucketStart = days[i].date;
        inc += days[i].income; exp += days[i].expense; count++; bucketEnd = days[i].date;
        if (count === 7 || i === days.length - 1) {
          running += inc - exp;
          rows.push({ label: `${fmtDate(bucketStart!)} – ${fmtDate(bucketEnd!)}`, income: inc, expense: exp, net: inc - exp, balance: running });
          inc = 0; exp = 0; count = 0;
        }
      }
    } else {
      const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const buckets: Record<string, { inc: number; exp: number; date: Date }> = {};
      days.forEach((d) => {
        const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
        if (!buckets[key]) buckets[key] = { inc: 0, exp: 0, date: new Date(d.date.getFullYear(), d.date.getMonth(), 1) };
        buckets[key].inc += d.income; buckets[key].exp += d.expense;
      });
      Object.values(buckets).sort((a, b) => a.date.getTime() - b.date.getTime()).forEach((b) => {
        running += b.inc - b.exp;
        rows.push({ label: `${names[b.date.getMonth()]} ${b.date.getFullYear()}`, income: b.inc, expense: b.exp, net: b.inc - b.exp, balance: running });
      });
    }
    return rows;
  }, [filteredTx, liquidCash, period]);

  // Forecast chart — always monthly aggregation for readable x-axis labels
  const monthlyForecast = useMemo(() => {
    const today = new Date();
    const horizonStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const horizonEnd = new Date(horizonStart.getFullYear(), horizonStart.getMonth() + 12, 0);
    const totalDays = Math.floor((horizonEnd.getTime() - horizonStart.getTime()) / 86400000) + 1;
    type Day = { date: Date; income: number; expense: number };
    const days: Day[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(horizonStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d, income: 0, expense: 0 });
    }
    const dayIndex = (d: Date) =>
      Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - horizonStart.getTime()) / 86400000);
    filteredTx.forEach((t: any) => {
      const freq = (t.frequency || 'monthly').toLowerCase();
      const amount = Math.abs(Number(t.amount) || Number(t.monthly) || 0);
      if (!amount) return;
      const baseDate = t.date ? new Date(Number(t.date)) : new Date();
      const startBound = t.start_date ? new Date(t.start_date) : null;
      const endBound = t.end_date ? new Date(t.end_date) : null;
      const place = (d: Date) => {
        if (d < horizonStart || d > horizonEnd) return;
        if (startBound && d < startBound) return;
        if (endBound && d > endBound) return;
        const idx = dayIndex(d);
        if (idx < 0 || idx >= days.length) return;
        if (t.type === 'income') days[idx].income += amount;
        else if (t.type === 'expense') days[idx].expense += amount;
      };
      if (freq === 'one-time' || freq === 'once') { place(baseDate); return; }
      const step: { months?: number; days?: number } = (() => {
        switch (freq) {
          case 'daily': return { days: 1 };
          case 'weekly': return { days: 7 };
          case 'fortnightly': case 'bi-weekly': case 'biweekly': return { days: 14 };
          case 'monthly': return { months: 1 };
          case 'quarterly': return { months: 3 };
          case 'half-yearly': case 'semi-annually': return { months: 6 };
          case 'yearly': case 'annually': return { months: 12 };
          default: return { months: 1 };
        }
      })();
      let cursor = new Date(baseDate);
      while (cursor < horizonStart) {
        if (step.months) cursor.setMonth(cursor.getMonth() + step.months);
        else if (step.days) cursor.setDate(cursor.getDate() + step.days);
        else break;
      }
      let safety = 0;
      while (cursor <= horizonEnd && safety < 2000) {
        place(cursor);
        const next = new Date(cursor);
        if (step.months) next.setMonth(next.getMonth() + step.months);
        else if (step.days) next.setDate(next.getDate() + step.days);
        else break;
        cursor = next;
        safety++;
      }
    });
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const buckets: Record<string, { inc: number; exp: number; date: Date }> = {};
    days.forEach((d) => {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      if (!buckets[key]) buckets[key] = { inc: 0, exp: 0, date: new Date(d.date.getFullYear(), d.date.getMonth(), 1) };
      buckets[key].inc += d.income;
      buckets[key].exp += d.expense;
    });
    let running = liquidCash;
    return Object.values(buckets)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((b) => {
        running += b.inc - b.exp;
        return {
          label: `${names[b.date.getMonth()]} ${String(b.date.getFullYear()).slice(2)}`,
          income: Math.round(b.inc),
          expense: Math.round(b.exp),
          balance: Math.round(running),
        };
      });
  }, [filteredTx, liquidCash]);

  const kpis = useMemo(() => {
    const incomeTotal = runningBalanceRows.reduce((s, r) => s + r.income, 0);
    const expenseTotal = runningBalanceRows.reduce((s, r) => s + r.expense, 0);
    const periods = runningBalanceRows.length || 1;
    const avgIncome = incomeTotal / periods;
    const avgExpense = expenseTotal / periods;
    const firstNeg = runningBalanceRows.find((r) => r.balance < 0);
    return { avgIncome, avgExpense, net: avgIncome - avgExpense, firstNeg: firstNeg?.label || 'Never' };
  }, [runningBalanceRows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Dashboard</h1>
          <p className="text-sm text-muted-foreground">Daily money flow at a glance</p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost Centre</Label>
            <Select value={costCentre} onValueChange={setCostCentre}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cost Centres</SelectItem>
                {costCentres.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Period</Label>
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(v) => v && setPeriod(v as Period)}
              className="border rounded-md"
            >
              {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                <ToggleGroupItem
                  key={p}
                  value={p}
                  className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {PERIOD_LABEL[p]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Badge variant="secondary" className="gap-1 self-end mb-0.5"><Sparkles className="h-3 w-3" />Insights</Badge>
        </div>
      </div>

      {/* Compact hero — period-aware Net Flow */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-3 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-80">{PERIOD_LABEL[period]} Net Flow {costCentre !== 'all' && `· ${costCentre}`}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold">{formatCurrency(kpis.net)}</span>
                <span className="text-[11px] opacity-80">/{period === 'daily' ? 'day' : period === 'weekly' ? 'wk' : 'mo'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-white/10 backdrop-blur px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[10px] opacity-90"><ArrowUpRight className="h-3 w-3" />Income/{period === 'daily' ? 'day' : period === 'weekly' ? 'wk' : 'mo'}</div>
              <p className="text-sm font-semibold">{formatCurrency(kpis.avgIncome)}</p>
            </div>
            <div className="rounded-md bg-white/10 backdrop-blur px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[10px] opacity-90"><ArrowDownRight className="h-3 w-3" />Spend/{period === 'daily' ? 'day' : period === 'weekly' ? 'wk' : 'mo'}</div>
              <p className="text-sm font-semibold">{formatCurrency(kpis.avgExpense)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card className="p-3"><div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Wallet className="h-3 w-3" />Cash (Bank)</div><p className="text-sm font-semibold mt-0.5">{formatCompact(liquidCash)}</p></Card>
        <Card className="p-3"><div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><TrendingUp className="h-3 w-3" />Saving</div><p className="text-sm font-semibold mt-0.5">{savingsRate.toFixed(0)}%</p></Card>
        <Card className="p-3"><div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Target className="h-3 w-3" />Net (mo)</div><p className={cn('text-sm font-semibold mt-0.5', monthlyNet >= 0 ? 'text-income' : 'text-expense')}>{formatCompact(monthlyNet)}</p></Card>
        <Card className="p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg {PERIOD_LABEL[period]} Net</p><p className={cn('text-sm font-semibold tabular-nums mt-0.5', kpis.net >= 0 ? 'text-income' : 'text-expense')}>{formatCompact(kpis.net)}</p></Card>
        <Card className="p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">First Negative</p><p className={cn('text-sm font-semibold mt-0.5', kpis.firstNeg === 'Never' ? 'text-income' : 'text-expense')}>{kpis.firstNeg}</p></Card>
      </div>

      {/* Cash Forecast chart — full width, monthly x-axis for readability */}
      <SleekChart
        kind="area"
        data={monthlyForecast}
        xKey="label"
        series={[
          { key: 'income', label: 'Income', color: 'income' },
          { key: 'expense', label: 'Expenses', color: 'expense' },
          { key: 'balance', label: 'Cash Balance', color: 'primary' },
        ]}
        title="Cash Forecast"
        subtitle="12-month projection · monthly"
        valueFormatter={(v) => formatCompact(Math.round(v))}
        compactHeight={180}
        expandedHeight={400}
      />


      {/* Running cash balance table — collapsible */}
      <Collapsible defaultOpen={false}>
        <Card className="p-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 text-left group"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  Running Cash Balance · {PERIOD_LABEL[period]}
                </h3>
                <p className="text-[10px] text-muted-foreground truncate">
                  Projected cash position over time {costCentre !== 'all' && `· filtered by ${costCentre}`}
                  {period === 'daily' && ' · showing first 90 days'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                    <th className="text-left py-2 px-2 font-medium">Period</th>
                    <th className="text-right py-2 px-2 font-medium">Income</th>
                    <th className="text-right py-2 px-2 font-medium">Expenses</th>
                    <th className="text-right py-2 px-2 font-medium">Net</th>
                    <th className="text-right py-2 px-2 font-medium">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {runningBalanceRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted-foreground">No data to project.</td>
                    </tr>
                  ) : (
                    runningBalanceRows.map((r, idx) => (
                      <tr key={idx} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-1.5 px-2">{r.label}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-income">{formatCompact(r.income)}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-expense">{formatCompact(r.expense)}</td>
                        <td className={cn('py-1.5 px-2 text-right tabular-nums font-medium', r.net >= 0 ? 'text-income' : 'text-expense')}>{formatCompact(r.net)}</td>
                        <td className={cn('py-1.5 px-2 text-right tabular-nums font-semibold', r.balance >= 0 ? 'text-primary' : 'text-destructive')}>{formatCompact(r.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <SnoopInsights />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-1">Where Your Money Goes</h2>
          <p className="text-xs text-muted-foreground mb-3">Top expenses with daily cost</p>
          <div className="space-y-3">
            {topExpenses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No expenses yet</p>}
            {topExpenses.map((e, i) => {
              const max = topExpenses[0]?.value || 1;
              const pct = (e.value / max) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{e.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatCompact(e.value)} <span className="text-xs">/ {formatCompact(e.daily)}d</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-expense/60 to-expense" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-1">Income Sources</h2>
          <p className="text-xs text-muted-foreground mb-3">Top income with daily contribution</p>
          <div className="space-y-3">
            {topIncomes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No income yet</p>}
            {topIncomes.map((e, i) => {
              const max = topIncomes[0]?.value || 1;
              const pct = (e.value / max) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{e.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatCompact(e.value)} <span className="text-xs">/ {formatCompact(e.daily)}d</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-income/60 to-income" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default FinanceDashboardView;
