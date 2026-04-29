import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { InlineTransactionsTable } from './InlineTransactionsTable';
import { ImportDialog } from './ImportDialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_DIVISOR: Record<Period, number> = { daily: 30, weekly: 30 / 7, monthly: 1, yearly: 1 / 12 };
const PERIOD_LABEL: Record<Period, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

export function CashFlowView() {
  const { transactions, balanceSheet, group, setGroup } = useFinancialData();
  const [period, setPeriod] = useState<Period>('monthly');
  const [importOpen, setImportOpen] = useState(false);

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
      group === 'all' ? true : (t.group || '').toLowerCase() === group.toLowerCase();

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
  }, [transactions, balanceSheet, group, period, monthLabels]);

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
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Group</Label>
          <Select value={group} onValueChange={(v: 'all' | 'personal' | 'corential') => setGroup(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="corential">Corential</SelectItem>
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
