import React, { useMemo } from 'react';
import { SleekChart } from '@/components/ui/SleekChart';

interface CashFlowChartProps {
  transactions: any[];
}

export const CashFlowChart = ({ transactions }: CashFlowChartProps) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      if (monthlyData[monthKey]) {
        if (t.type === 'income') monthlyData[monthKey].income += t.monthly || t.amount;
        else if (t.type === 'expense') monthlyData[monthKey].expense += t.monthly || t.amount;
      }
    });

    let running = 0;
    return Object.entries(monthlyData).map(([month, d]) => {
      running += d.income - d.expense;
      return {
        month,
        income: Math.round(d.income),
        expense: Math.round(d.expense),
        balance: Math.round(running),
      };
    });
  }, [transactions]);

  const fmt = (v: number) =>
    Math.abs(v) >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${Math.round(v)}`;

  const finalBalance = chartData[chartData.length - 1]?.balance ?? 0;

  return (
    <SleekChart
      kind="line"
      data={chartData}
      xKey="month"
      series={[
        { key: 'income', label: 'Income', color: 'income' },
        { key: 'expense', label: 'Expenses', color: 'expense' },
        { key: 'balance', label: 'Running Balance', color: 'primary' },
      ]}
      title="12-Month Cash Flow Projection"
      subtitle="Income, expenses and running balance"
      kpi={fmt(finalBalance)}
      valueFormatter={fmt}
      compactHeight={140}
      expandedHeight={380}
    />
  );
};
