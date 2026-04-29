import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_DIVISOR: Record<Period, number> = { daily: 30, weekly: 30 / 7, monthly: 1, yearly: 1 / 12 };
const PERIOD_LABEL: Record<Period, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

export function CashFlowView() {
  const { transactions, balanceSheet } = useFinancialData();
  const [period, setPeriod] = useState<Period>('monthly');
  const [costCentre, setCostCentre] = useState<string>('all');
  const [costCentres, setCostCentres] = useState<string[]>(loadCostCentres());

  useEffect(() => {
    const handler = () => setCostCentres(loadCostCentres());
    window.addEventListener('cost-centres-changed', handler);
    return () => window.removeEventListener('cost-centres-changed', handler);
  }, []);

  // Include any cost centres present in the data but missing from the managed list
  const allCostCentres = useMemo(() => {
    const set = new Set<string>(costCentres);
    transactions.forEach((t: any) => t.cost_centre && set.add(t.cost_centre));
    return Array.from(set);
  }, [costCentres, transactions]);

  const monthLabels = useMemo(() => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date();
    const out: string[] = [];
    for (let i = 0; i < 12; i++) {
      const mi = (d.getMonth() + i) % 12;
      const yo = Math.floor((d.getMonth() + i) / 12);
      out.push(`${names[mi]} ${d.getFullYear() + yo}`);
    }
    return out;
  }, []);

  const chartData = useMemo(() => {
    const div = PERIOD_DIVISOR[period];
    const initialCash = balanceSheet.bankAccounts.reduce((s, a) => s + a.balance, 0);
    let running = initialCash;
    const rows: any[] = [];
    const groupFilter = (t: any) =>
      costCentre === 'all' ? true : (t.cost_centre || '').toLowerCase() === costCentre.toLowerCase();

    if (period === 'yearly') {
      // Single yearly bucket (sum of 12 months)
      const inc = transactions
        .filter((t) => t.type === 'income' && groupFilter(t))
        .reduce((s, t) => s + (t.projections?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0);
      const exp = Math.abs(
        transactions
          .filter((t) => t.type === 'expense' && groupFilter(t))
          .reduce((s, t) => s + (t.projections?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0)
      );
      const yr = new Date().getFullYear();
      rows.push({ label: String(yr), income: inc, expense: exp, net: inc - exp, cash: initialCash + inc - exp });
    } else {
      monthLabels.forEach((label, i) => {
        const inc = transactions
          .filter((t) => t.type === 'income' && groupFilter(t))
          .reduce((s, t) => s + (t.projections[i] || 0), 0) / div;
        const exp = Math.abs(
          transactions
            .filter((t) => t.type === 'expense' && groupFilter(t))
            .reduce((s, t) => s + (t.projections[i] || 0), 0)
        ) / div;
        running += (inc - exp) * div;
        rows.push({ label, income: inc, expense: exp, net: inc - exp, cash: running });
      });
    }
    return rows;
  }, [transactions, balanceSheet, costCentre, period, monthLabels]);

  // Daily-level running balance projected over the next 12 months,
  // then aggregated into the chosen period (daily/weekly/monthly/yearly).
  const runningBalanceRows = useMemo(() => {
    const groupFilter = (t: any) =>
      costCentre === 'all' ? true : (t.cost_centre || '').toLowerCase() === costCentre.toLowerCase();
    const filtered = transactions.filter(groupFilter);
    const initialCash = balanceSheet.bankAccounts.reduce((s, a) => s + a.balance, 0);

    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Build a flat array of daily { date, income, expense } across the next 12 months
    type Day = { date: Date; income: number; expense: number };
    const days: Day[] = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

      const monthIncome = filtered
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + (t.projections?.[i] || 0), 0);
      const monthExpense = Math.abs(
        filtered
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + (t.projections?.[i] || 0), 0)
      );

      const dailyIncome = monthIncome / daysInMonth;
      const dailyExpense = monthExpense / daysInMonth;

      for (let d = 1; d <= daysInMonth; d++) {
        days.push({
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), d),
          income: dailyIncome,
          expense: dailyExpense,
        });
      }
    }

    // Aggregate based on selected period
    type Row = { label: string; income: number; expense: number; net: number; balance: number };
    const rows: Row[] = [];
    let running = initialCash;

    const fmtDate = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (period === 'daily') {
      // Cap to ~90 days for usability
      const cap = Math.min(days.length, 90);
      for (let i = 0; i < cap; i++) {
        const day = days[i];
        running += day.income - day.expense;
        rows.push({
          label: fmtDate(day.date),
          income: day.income,
          expense: day.expense,
          net: day.income - day.expense,
          balance: running,
        });
      }
    } else if (period === 'weekly') {
      // Group into 7-day buckets starting from today
      let bucketStart = days[0]?.date;
      let bucketEnd: Date | null = null;
      let inc = 0,
        exp = 0,
        count = 0;
      for (let i = 0; i < days.length; i++) {
        if (count === 0) bucketStart = days[i].date;
        inc += days[i].income;
        exp += days[i].expense;
        count++;
        bucketEnd = days[i].date;
        if (count === 7 || i === days.length - 1) {
          running += inc - exp;
          rows.push({
            label: `${fmtDate(bucketStart!)} – ${fmtDate(bucketEnd!)}`,
            income: inc,
            expense: exp,
            net: inc - exp,
            balance: running,
          });
          inc = 0;
          exp = 0;
          count = 0;
        }
      }
    } else if (period === 'monthly') {
      const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
        const monthIncome = filtered
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + (t.projections?.[i] || 0), 0);
        const monthExpense = Math.abs(
          filtered
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + (t.projections?.[i] || 0), 0)
        );
        running += monthIncome - monthExpense;
        rows.push({
          label: `${names[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
          income: monthIncome,
          expense: monthExpense,
          net: monthIncome - monthExpense,
          balance: running,
        });
      }
    } else {
      // yearly — single bucket sum across 12 months
      const totalIncome = days.reduce((s, d) => s + d.income, 0);
      const totalExpense = days.reduce((s, d) => s + d.expense, 0);
      running += totalIncome - totalExpense;
      rows.push({
        label: String(today.getFullYear()),
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
        balance: running,
      });
    }

    return rows;
  }, [transactions, balanceSheet, costCentre, period]);

  const kpis = useMemo(() => {
    const incomeTotal = chartData.reduce((s, r) => s + r.income, 0);
    const expenseTotal = chartData.reduce((s, r) => s + r.expense, 0);
    const periods = chartData.length || 1;
    const avgIncome = incomeTotal / periods;
    const avgExpense = expenseTotal / periods;
    const firstNeg = chartData.find((r) => r.cash < 0);
    return { avgIncome, avgExpense, net: avgIncome - avgExpense, firstNeg: firstNeg?.label || 'Never' };
  }, [chartData]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Period</Label>
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(v) => v && setPeriod(v as Period)}
            className="border rounded-md"
          >
            {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
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
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost Centre</Label>
          <Select value={costCentre} onValueChange={setCostCentre}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cost Centres</SelectItem>
              {allCostCentres.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg {PERIOD_LABEL[period]} Income</p>
          <p className="text-base font-semibold text-income tabular-nums">{fmt(kpis.avgIncome)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg {PERIOD_LABEL[period]} Expenses</p>
          <p className="text-base font-semibold text-expense tabular-nums">{fmt(kpis.avgExpense)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net per {PERIOD_LABEL[period]}</p>
          <p className={cn('text-base font-semibold tabular-nums', kpis.net >= 0 ? 'text-income' : 'text-expense')}>
            {fmt(kpis.net)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">First Negative</p>
          <p className={cn('text-base font-semibold', kpis.firstNeg === 'Never' ? 'text-success' : 'text-destructive')}>
            {kpis.firstNeg}
          </p>
        </Card>
      </div>

      {/* Single chart */}
      <Card className="p-4">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 50 }}>
              <defs>
                <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} interval={0} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: 'hsl(var(--primary))' }}
                tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={(v: number) => fmt(Math.round(v))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="income" fill="url(#ig)" stroke="hsl(var(--income))" name="Income" yAxisId="left" />
              <Area type="monotone" dataKey="expense" fill="url(#eg)" stroke="hsl(var(--expense))" name="Expenses" yAxisId="left" />
              <Line
                type="monotone"
                dataKey="cash"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                name="Cash Balance"
                dot={false}
                yAxisId="right"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Editable transactions table */}
      <InlineTransactionsTable />
    </div>
  );
}
