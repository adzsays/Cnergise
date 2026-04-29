import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { cn } from '@/lib/utils';
import { useUserCurrency } from '@/hooks/useUserCurrency';

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

export function CashFlowView() {
  const { transactions, balanceSheet, accounts } = useFinancialData();
  const { formatWhole: fmt } = useUserCurrency();
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

  // Only liquid Bank accounts contribute to running cash. Other assets
  // (savings, investments, pension, crypto, cash, etc.) are excluded.
  const liquidBankAccounts = useMemo(
    () => balanceSheet.bankAccounts.filter((a) => (a.category || '').toLowerCase() === 'bank'),
    [balanceSheet.bankAccounts]
  );

  // Credit card liabilities — balance is stored negative on liabilities; absolute value is debt owed.
  // Use the user-defined `monthly_payment` from the underlying financial_account when set;
  // otherwise estimate the minimum payment as max(£25, 3% of outstanding balance).
  const creditCards = useMemo(
    () =>
      balanceSheet.liabilities
        .filter((l) => (l.category || '').toLowerCase() === 'credit card')
        .map((l) => {
          const owed = Math.abs(l.balance);
          const underlying = accounts.find((acc) => acc.id === l.id);
          const userPayment = Number(underlying?.monthly_payment) || 0;
          const estimated = Math.max(25, owed * 0.03);
          const payment = userPayment > 0 ? userPayment : estimated;
          return { id: l.id, name: l.name, owed, payment };
        })
        .filter((c) => c.owed > 0),
    [balanceSheet.liabilities, accounts]
  );

  // Total monthly credit card payment (capped to remaining owed each month, computed in projections).
  const totalCcPaymentMonthly = useMemo(
    () => creditCards.reduce((s, c) => s + c.payment, 0),
    [creditCards]
  );

  const chartData = useMemo(() => {
    const div = PERIOD_DIVISOR[period];
    const initialCash = liquidBankAccounts.reduce((s, a) => s + a.balance, 0);
    let running = initialCash;
    // Track remaining credit card balance so payments stop when paid off
    let ccRemaining = creditCards.reduce((s, c) => s + c.owed, 0);
    const rows: any[] = [];
    const groupFilter = (t: any) =>
      costCentre === 'all' ? true : (t.cost_centre || '').toLowerCase() === costCentre.toLowerCase();

    if (period === 'yearly') {
      // Single yearly bucket (sum of 12 months)
      const inc = transactions
        .filter((t) => t.type === 'income' && groupFilter(t))
        .reduce((s, t) => s + (t.projections?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0);
      const baseExp = Math.abs(
        transactions
          .filter((t) => t.type === 'expense' && groupFilter(t))
          .reduce((s, t) => s + (t.projections?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0)
      );
      // Total CC payments over 12 months, capped to total owed
      const totalCcOwed = creditCards.reduce((s, c) => s + c.owed, 0);
      const ccTotal = Math.min(totalCcOwed, totalCcPaymentMonthly * 12);
      const exp = baseExp + ccTotal;
      const yr = new Date().getFullYear();
      rows.push({ label: String(yr), income: inc, expense: exp, net: inc - exp, cash: initialCash + inc - exp });
    } else {
      monthLabels.forEach((label, i) => {
        const inc = transactions
          .filter((t) => t.type === 'income' && groupFilter(t))
          .reduce((s, t) => s + (t.projections[i] || 0), 0) / div;
        const baseExp = Math.abs(
          transactions
            .filter((t) => t.type === 'expense' && groupFilter(t))
            .reduce((s, t) => s + (t.projections[i] || 0), 0)
        ) / div;
        // Credit card payment for this month, capped to remaining balance, scaled to period
        const ccPaymentThisMonth = Math.min(ccRemaining, totalCcPaymentMonthly);
        ccRemaining = Math.max(0, ccRemaining - ccPaymentThisMonth);
        const ccExp = ccPaymentThisMonth / div;
        const exp = baseExp + ccExp;
        running += (inc - exp) * div;
        rows.push({ label, income: inc, expense: exp, net: inc - exp, cash: running });
      });
    }
    return rows;
  }, [transactions, liquidBankAccounts, creditCards, totalCcPaymentMonthly, costCentre, period, monthLabels]);

  // Daily-level running balance projected over the next 12 months,
  // then aggregated into the chosen period (daily/weekly/monthly/yearly).
  const runningBalanceRows = useMemo(() => {
    const groupFilter = (t: any) =>
      costCentre === 'all' ? true : (t.cost_centre || '').toLowerCase() === costCentre.toLowerCase();
    const filtered = transactions.filter(groupFilter);
    const initialCash = liquidBankAccounts.reduce((s, a) => s + a.balance, 0);

    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Build a flat array of daily { date, income, expense } across the next 12 months,
    // placing each transaction's amount on its actual occurrence dates based on frequency.
    type Day = { date: Date; income: number; expense: number };
    const horizonStart = startMonth;
    const horizonEnd = new Date(startMonth.getFullYear(), startMonth.getMonth() + 12, 0); // last day of month +11
    const totalDays =
      Math.floor((horizonEnd.getTime() - horizonStart.getTime()) / 86400000) + 1;
    const days: Day[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(horizonStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d, income: 0, expense: 0 });
    }
    const dayIndex = (d: Date) =>
      Math.floor(
        (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
          horizonStart.getTime()) /
          86400000
      );

    // Generate occurrence dates per transaction respecting frequency + start/end bounds
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
        else days[idx].expense += amount;
      };

      if (freq === 'one-time' || freq === 'once') {
        place(baseDate);
        return;
      }

      // Determine step in days/months for recurring frequencies
      const stepConfig: { months?: number; days?: number } = (() => {
        switch (freq) {
          case 'daily':
            return { days: 1 };
          case 'weekly':
            return { days: 7 };
          case 'fortnightly':
          case 'bi-weekly':
          case 'biweekly':
            return { days: 14 };
          case 'monthly':
            return { months: 1 };
          case 'quarterly':
            return { months: 3 };
          case 'half-yearly':
          case 'semi-annually':
            return { months: 6 };
          case 'yearly':
          case 'annually':
            return { months: 12 };
          default:
            return { months: 1 };
        }
      })();

      // Walk forward from baseDate, but also catch occurrences that fall in horizon
      // even if baseDate is in the past — by stepping forward until we reach horizonStart.
      let cursor = new Date(baseDate);
      // Fast-forward into horizon
      while (cursor < horizonStart) {
        if (stepConfig.months) cursor.setMonth(cursor.getMonth() + stepConfig.months);
        else if (stepConfig.days) cursor.setDate(cursor.getDate() + stepConfig.days);
        else break;
      }
      // Walk through horizon
      let safety = 0;
      while (cursor <= horizonEnd && safety < 2000) {
        place(cursor);
        const next = new Date(cursor);
        if (stepConfig.months) next.setMonth(next.getMonth() + stepConfig.months);
        else if (stepConfig.days) next.setDate(next.getDate() + stepConfig.days);
        else break;
        cursor = next;
        safety++;
      }
    };

    filtered.forEach(addOccurrences);

    // Place credit-card payments on the 1st of each month within the horizon,
    // capped to the remaining outstanding balance so payments stop once paid off.
    {
      let ccRemaining = creditCards.reduce((s, c) => s + c.owed, 0);
      const monthsCount = 12;
      for (let m = 0; m < monthsCount && ccRemaining > 0; m++) {
        const payDate = new Date(horizonStart.getFullYear(), horizonStart.getMonth() + m, 1);
        const idx = dayIndex(payDate);
        if (idx < 0 || idx >= days.length) continue;
        const pay = Math.min(ccRemaining, totalCcPaymentMonthly);
        days[idx].expense += pay;
        ccRemaining -= pay;
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
      // Aggregate the daily occurrences by calendar month
      const monthBuckets: Record<string, { inc: number; exp: number; date: Date }> = {};
      days.forEach((d) => {
        const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
        if (!monthBuckets[key])
          monthBuckets[key] = { inc: 0, exp: 0, date: new Date(d.date.getFullYear(), d.date.getMonth(), 1) };
        monthBuckets[key].inc += d.income;
        monthBuckets[key].exp += d.expense;
      });
      Object.values(monthBuckets)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .forEach((b) => {
          running += b.inc - b.exp;
          rows.push({
            label: `${names[b.date.getMonth()]} ${b.date.getFullYear()}`,
            income: b.inc,
            expense: b.exp,
            net: b.inc - b.exp,
            balance: running,
          });
        });
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
  }, [transactions, liquidBankAccounts, creditCards, totalCcPaymentMonthly, costCentre, period]);

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

      {/* Running balance table — daily / weekly / monthly / yearly */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Running Cash Balance · {PERIOD_LABEL[period]}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Projected cash position over time {costCentre !== 'all' && `· filtered by ${costCentre}`}
              {period === 'daily' && ' · showing first 90 days'}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
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
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    No data to project.
                  </td>
                </tr>
              ) : (
                runningBalanceRows.map((r, idx) => (
                  <tr key={idx} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-1.5 px-2">{r.label}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-income">{fmt(r.income)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-expense">{fmt(r.expense)}</td>
                    <td
                      className={cn(
                        'py-1.5 px-2 text-right tabular-nums font-medium',
                        r.net >= 0 ? 'text-income' : 'text-expense'
                      )}
                    >
                      {fmt(r.net)}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 px-2 text-right tabular-nums font-semibold',
                        r.balance >= 0 ? 'text-primary' : 'text-destructive'
                      )}
                    >
                      {fmt(r.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
