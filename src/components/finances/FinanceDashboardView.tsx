import { useMemo, useState } from 'react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp, Wallet, Target } from 'lucide-react';
import { SleekChart } from '@/components/ui/SleekChart';

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
      // Normalize each transaction's stored amount to a true per-month equivalent
      // based on its frequency, so yearly items (e.g. director's salary) aren't
      // counted in full every month. Keeps the dashboard consistent with the
      // Cash Flow summary.
      const FREQ_TO_MONTHLY: Record<string, number> = {
        'daily': 30,
        'weekly': 52 / 12,
        'fortnightly': 26 / 12,
        'bi-weekly': 26 / 12,
        'biweekly': 26 / 12,
        'monthly': 1,
        'quarterly': 1 / 3,
        'half-yearly': 1 / 6,
        'semi-annually': 1 / 6,
        'yearly': 1 / 12,
        'annually': 1 / 12,
        'one-time': 0,
        'once': 0,
      };
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      // Honour start_date / end_date so future-dated items (e.g. director's
      // salary starting Apr 2027) don't inflate the current month.
      const isActiveThisMonth = (t: any) => {
        if (t.start_date && new Date(t.start_date) > monthEnd) return false;
        if (t.end_date && new Date(t.end_date) < monthStart) return false;
        return true;
      };
      const toMonthly = (t: any) => {
        if (!isActiveThisMonth(t)) return 0;
        // Prefer per-month projection for current month when it varies
        // (e.g. mortgage payment crossing a fixed-rate boundary).
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

      // Build true daily series — place actual transactions on their occurrence day,
      // and spread items without an explicit day across the month evenly.
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
        .map((t) => ({ name: t.subcategory || t.category, value: toMonthly(t), daily: toMonthly(t) / daysInMonth }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      const topIncomes = [...incomes]
        .map((t) => ({ name: t.subcategory || t.category, value: toMonthly(t), daily: toMonthly(t) / daysInMonth }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

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

      <SleekChart
        kind="area"
        data={dailyData}
        xKey="label"
        series={[
          { key: 'income', label: 'Income', color: 'income' },
          { key: 'expense', label: 'Expense', color: 'expense' },
        ]}
        title="Daily Money Flow"
        subtitle="Income vs expenses, day by day this month"
        valueFormatter={(v) => formatCompact(v)}
        compactHeight={140}
      />

      <SleekChart
        kind="area"
        data={dailyData}
        xKey="label"
        series={[{ key: 'cumulative', label: 'Cumulative', color: 'primary' }]}
        title="Cumulative Cash This Month"
        subtitle="Running total day by day"
        valueFormatter={(v) => formatCompact(v)}
        compactHeight={120}
      />

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
