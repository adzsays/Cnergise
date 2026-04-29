import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap } from 'recharts';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { Building2, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TableView } from './TableView';

export function CashFlowView() {
  const { transactions, balanceSheet, viewMode, setViewMode, group, setGroup } = useFinancialData();
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'business'>('monthly');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  const monthLabels = (() => {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date();
    const cm = d.getMonth(); const cy = d.getFullYear();
    const labels: string[] = [];
    for (let i = 0; i < 12; i++) {
      const mi = (cm + i) % 12;
      const yo = Math.floor((cm + i) / 12);
      labels.push(`${names[mi]} ${cy + yo}`);
    }
    return labels;
  })();

  const getChartData = () => {
    const initial = balanceSheet.bankAccounts.reduce((s, a) => s + a.balance, 0)
                  + balanceSheet.investments.reduce((s, a) => s + a.balance, 0);
    const data: any[] = [];
    const divisor = timeframe === 'daily' ? 30 : timeframe === 'business' ? 20 : 1;
    const today = new Date(); const day = today.getDate();
    monthLabels.forEach((month, index) => {
      const filter = (list: typeof transactions) => index === 0
        ? list.filter((t) => new Date(t.date).getDate() <= day)
        : list;
      const ft = filter(transactions);
      const sumBy = (type: string, g: string) => ft
        .filter((t) => t.type === type && (t.group || '').toLowerCase() === g)
        .reduce((s, t) => s + (t.projections[index] || 0), 0) / divisor;
      const personalIncome = sumBy('income', 'personal');
      const personalExpense = Math.abs(sumBy('expense', 'personal'));
      const corentialIncome = sumBy('income', 'corential');
      const corentialExpense = Math.abs(sumBy('expense', 'corential'));
      const totalNet = personalIncome + corentialIncome - personalExpense - corentialExpense;
      const cashBalance = index === 0 ? initial + totalNet * divisor : data[index - 1].cashBalance + totalNet * divisor;
      data.push({
        month,
        personalIncome, personalExpense, personalNet: personalIncome - personalExpense,
        corentialIncome, corentialExpense, corentialNet: corentialIncome - corentialExpense,
        totalIncome: personalIncome + corentialIncome,
        totalExpense: personalExpense + corentialExpense,
        totalNet, cashBalance,
      });
    });
    return data;
  };

  const chartData = getChartData();
  const selectedMonth = chartData[selectedMonthIndex];
  const totalIncome = selectedMonth?.totalIncome || 0;
  const totalExpenses = selectedMonth?.totalExpense || 0;
  const personalIncome = selectedMonth?.personalIncome || 0;
  const personalExpenses = selectedMonth?.personalExpense || 0;
  const corentialIncome = selectedMonth?.corentialIncome || 0;
  const corentialExpenses = selectedMonth?.corentialExpense || 0;

  const totalAssets =
    balanceSheet.bankAccounts.reduce((s, a) => s + a.balance, 0) +
    balanceSheet.investments.reduce((s, a) => s + a.balance, 0) +
    balanceSheet.pensions.reduce((s, a) => s + a.balance, 0) +
    balanceSheet.homeValue + balanceSheet.carValue;
  const totalLiabilities = Math.abs(balanceSheet.liabilities.reduce((s, a) => s + a.balance, 0));
  const netAssets = totalAssets - totalLiabilities;
  const firstNeg = chartData.find((m) => m.cashBalance < 0);
  const negDate = firstNeg ? firstNeg.month : 'Never';
  const divisor = timeframe === 'daily' ? 30 : timeframe === 'business' ? 20 : 1;

  const buildTreeData = (type: 'income' | 'expense') => {
    const totals = new Map<string, number>();
    transactions
      .filter((t) => t.type === type && (group === 'all' || (t.group || '').toLowerCase() === group.toLowerCase()))
      .forEach((t) => {
        const v = Math.abs(t.projections[selectedMonthIndex] || 0) / divisor;
        totals.set(t.subcategory, (totals.get(t.subcategory) || 0) + v);
      });
    const arr = Array.from(totals.entries()).map(([name, value]) => ({ name, value, size: value })).filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
    const total = arr.reduce((s, i) => s + i.value, 0);
    const threshold = total * 0.01;
    const main = arr.filter((i) => i.value >= threshold);
    const other = arr.filter((i) => i.value < threshold);
    if (other.length) {
      const ot = other.reduce((s, i) => s + i.value, 0);
      return [...main, { name: 'Other', value: ot, size: ot }];
    }
    return main;
  };

  const expenseTree = buildTreeData('expense');
  const incomeTree = buildTreeData('income');

  const TreeContent = (props: any) => {
    const { x, y, width, height, name, value, index = 0 } = props;
    if (!name || !width || !height || width <= 0 || height <= 0) return null;
    const colors = [['#3B82F6','#2563EB'],['#10B981','#059669'],['#8B5CF6','#7C3AED'],['#F59E0B','#D97706'],['#EF4444','#DC2626'],['#06B6D4','#0891B2'],['#EC4899','#DB2777'],['#6366F1','#4F46E5']];
    const c = colors[index % colors.length];
    const showText = width > 50 && height > 30;
    return (
      <g>
        <defs>
          <linearGradient id={`tg-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c[0]} stopOpacity={0.9} />
            <stop offset="100%" stopColor={c[1]} stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <rect x={x + 1} y={y + 1} width={Math.max(0, width - 2)} height={Math.max(0, height - 2)} rx={6} ry={6} style={{ fill: `url(#tg-${index})` }}>
          <title>{`${name}: £${Math.round(value).toLocaleString()}`}</title>
        </rect>
        {showText && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight="500">
            {name.length > 12 ? name.slice(0, 10) + '…' : name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex items-center gap-2">
          <Label className="text-xs">View:</Label>
          <Select value={group} onValueChange={(v: 'all' | 'personal' | 'corential') => setGroup(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="personal"><div className="flex items-center gap-2"><User className="h-4 w-4" />Personal</div></SelectItem>
              <SelectItem value="corential"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Corential</div></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${viewMode === 'type' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>By Type</span>
          <Switch checked={viewMode === 'costcentre'} onCheckedChange={(c) => setViewMode(c ? 'costcentre' : 'type')} />
          <span className={`text-xs ${viewMode === 'costcentre' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>By Cost Centre</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs">Period:</Label>
          <RadioGroup value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="flex gap-3">
            <div className="flex items-center gap-1"><RadioGroupItem value="daily" id="d" /><Label htmlFor="d" className="text-xs">Daily</Label></div>
            <div className="flex items-center gap-1"><RadioGroupItem value="business" id="b" /><Label htmlFor="b" className="text-xs">Business</Label></div>
            <div className="flex items-center gap-1"><RadioGroupItem value="monthly" id="m" /><Label htmlFor="m" className="text-xs">Monthly</Label></div>
          </RadioGroup>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: `${monthLabels[selectedMonthIndex]} Income`, value: group === 'personal' ? personalIncome : group === 'corential' ? corentialIncome : totalIncome, color: 'text-income' },
          { label: `${monthLabels[selectedMonthIndex]} Expenses`, value: group === 'personal' ? personalExpenses : group === 'corential' ? corentialExpenses : totalExpenses, color: 'text-expense' },
          { label: 'Net Difference', value: (group === 'personal' ? personalIncome - personalExpenses : group === 'corential' ? corentialIncome - corentialExpenses : totalIncome - totalExpenses), color: 'text-primary' },
          { label: 'Cash Balance', value: selectedMonth?.cashBalance || 0, color: 'text-primary' },
          { label: 'Total Assets', value: totalAssets, color: 'text-success' },
          { label: 'Total Liabilities', value: totalLiabilities, color: 'text-expense' },
          { label: 'Net Assets', value: netAssets, color: 'text-primary' },
          { label: 'First Negative', value: negDate, color: negDate === 'Never' ? 'text-success' : 'text-destructive', isText: true },
        ].map((m, i) => (
          <Card key={i} className="p-2">
            <p className="text-[10px] text-muted-foreground leading-tight mb-0.5">{m.label}</p>
            <p className={`text-sm font-bold ${m.color}`}>{m.isText ? m.value : `£${Math.round(Number(m.value)).toLocaleString()}`}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-4">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 60 }}
                onClick={(d) => { if (d && d.activeTooltipIndex !== undefined) setSelectedMonthIndex(d.activeTooltipIndex); }}>
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0.02} /></linearGradient>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0.02} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={0} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--primary))' }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: 12 }} formatter={(v: number) => `£${Math.round(v).toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey={group === 'personal' ? 'personalIncome' : group === 'corential' ? 'corentialIncome' : 'totalIncome'} fill="url(#ig)" stroke="hsl(var(--income))" name="Income" yAxisId="left" />
                <Area type="monotone" dataKey={group === 'personal' ? 'personalExpense' : group === 'corential' ? 'corentialExpense' : 'totalExpense'} fill="url(#eg)" stroke="hsl(var(--expense))" name="Expenses" yAxisId="left" />
                <Line type="monotone" dataKey="cashBalance" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeDasharray="5 5" name="Cash Balance" dot={false} yAxisId="right" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <Card className="p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-expense" />Expenses</h3>
            <div className="h-[140px]">
              {expenseTree.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap data={expenseTree} dataKey="size" aspectRatio={4/3} stroke="transparent" content={<TreeContent />} isAnimationActive={false} />
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>}
            </div>
          </Card>
          <Card className="p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-income" />Income</h3>
            <div className="h-[140px]">
              {incomeTree.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap data={incomeTree} dataKey="size" aspectRatio={4/3} stroke="transparent" content={<TreeContent />} isAnimationActive={false} />
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>}
            </div>
          </Card>
        </div>
      </div>

      <TableView />
    </div>
  );
}
