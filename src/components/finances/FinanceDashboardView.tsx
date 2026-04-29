import { useMemo, useState } from 'react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp, Wallet, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
const formatCompact = (n: number) => (Math.abs(n) >= 1000 ? `£${(n / 1000).toFixed(1)}k` : `£${Math.round(n)}`);

export function FinanceDashboardView() {
  const { transactions, balanceSheet } = useFinancialData();
  const [costCentre, setCostCentre] = useState<string>('all');

  // Discover cost centres present in the data
  const costCentres = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t: any) => t.cost_centre && set.add(t.cost_centre));
    return Array.from(set).sort();
  }, [transactions]);

  // Cash = liquid bank accounts only (category === "bank")
  const liquidCash = useMemo(
    () =>
      balanceSheet.bankAccounts
        .filter((a) => (a.category || '').toLowerCase() === 'bank')
        .reduce((s, a) => s + a.balance, 0),
    [balanceSheet.bankAccounts]
  );

  const filteredTx = useMemo(
    () =>
      costCentre === 'all'
        ? transactions
        : transactions.filter((t: any) => (t.cost_centre || '').toLowerCase() === costCentre.toLowerCase()),
    [transactions, costCentre]
  );

  const { dailyData, monthlyIncome, monthlyExpense, dailyAvgIncome, dailyAvgExpense, topExpenses, topIncomes, daysInMonth } =
    useMemo(() => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const incomes = filteredTx.filter((t) => t.type === 'income');
      const expenses = filteredTx.filter((t) => t.type === 'expense');
      const monthlyIncome = incomes.reduce((s, t) => s + Math.abs(t.monthly), 0);
      const monthlyExpense = expenses.reduce((s, t) => s + Math.abs(t.monthly), 0);
      const dailyAvgIncome = monthlyIncome / daysInMonth;
      const dailyAvgExpense = monthlyExpense / daysInMonth;

      // Build true daily series — place actual transactions on their occurrence day,
      // and spread items without an explicit day across the month evenly.
      const dailySeries: { income: number; expense: number }[] = Array.from({ length: daysInMonth }, () => ({ income: 0, expense: 0 }));
      const placeOrSpread = (t: any, bucket: 'income' | 'expense') => {
        const amt = Math.abs(t.monthly);
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

      let cumulative = 0;
      const series = dailySeries.map((d, i) => {
        cumulative += d.income - d.expense;
        return {
          day: i + 1,
          label: `${i + 1}`,
          income: Math.round(d.income),
          expense: Math.round(d.expense),
          cumulative: Math.round(cumulative),
        };
      });

      const topExpenses = [...expenses]
        .sort((a, b) => Math.abs(b.monthly) - Math.abs(a.monthly))
        .slice(0, 5)
        .map((t) => ({ name: t.subcategory || t.category, value: Math.abs(t.monthly), daily: Math.abs(t.monthly) / daysInMonth }));
      const topIncomes = [...incomes]
        .sort((a, b) => Math.abs(b.monthly) - Math.abs(a.monthly))
        .slice(0, 5)
        .map((t) => ({ name: t.subcategory || t.category, value: Math.abs(t.monthly), daily: Math.abs(t.monthly) / daysInMonth }));

      return { dailyData: series, monthlyIncome, monthlyExpense, dailyAvgIncome, dailyAvgExpense, topExpenses, topIncomes, daysInMonth };
    }, [filteredTx]);

  const monthlyNet = monthlyIncome - monthlyExpense;
  const dailyNet = dailyAvgIncome - dailyAvgExpense;
  const savingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Dashboard</h1>
          <p className="text-sm text-muted-foreground">Daily money flow at a glance</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />Insights</Badge>
        </div>
      </div>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-5 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider opacity-80">Daily Net Flow {costCentre !== 'all' && `· ${costCentre}`}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">{formatCurrency(dailyNet)}</span>
            <span className="text-sm opacity-80">/day</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl bg-white/10 backdrop-blur p-3">
              <div className="flex items-center gap-1 text-xs opacity-90"><ArrowUpRight className="h-3 w-3" /> Income / day</div>
              <p className="text-lg font-semibold mt-1">{formatCurrency(dailyAvgIncome)}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-3">
              <div className="flex items-center gap-1 text-xs opacity-90"><ArrowDownRight className="h-3 w-3" /> Spend / day</div>
              <p className="text-lg font-semibold mt-1">{formatCurrency(dailyAvgExpense)}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3 w-3" />Cash (Bank)</div><p className="text-base font-semibold mt-1">{formatCompact(liquidCash)}</p></Card>
        <Card className="p-3"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" />Saving</div><p className="text-base font-semibold mt-1">{savingsRate.toFixed(0)}%</p></Card>
        <Card className="p-3"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Target className="h-3 w-3" />Net</div><p className={`text-base font-semibold mt-1 ${monthlyNet >= 0 ? 'text-income' : 'text-expense'}`}>{formatCompact(monthlyNet)}</p></Card>
      </div>

      <Card className="p-4">
        <div className="mb-3"><h2 className="font-semibold">Daily Money Flow</h2><p className="text-xs text-muted-foreground">Income vs expenses, day by day this month</p></div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0} /></linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(daysInMonth / 6))} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Income' : 'Expense']} labelFormatter={(l) => `Day ${l}`} />
              <Area type="monotone" dataKey="income" stroke="hsl(var(--income))" strokeWidth={2} fill="url(#incomeFill)" />
              <Area type="monotone" dataKey="expense" stroke="hsl(var(--expense))" strokeWidth={2} fill="url(#expenseFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3"><h2 className="font-semibold">Cumulative Cash This Month</h2><p className="text-xs text-muted-foreground">Running total day by day</p></div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs><linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(daysInMonth / 6))} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [formatCurrency(value), 'Cumulative']} labelFormatter={(l) => `Day ${l}`} />
              <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#cumFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

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
