import React from 'react';
import { SleekChart } from '@/components/ui/SleekChart';

interface NetWorthChartProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

export const NetWorthChart = ({ data, title }: NetWorthChartProps) => {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);

  // Normalize so SleekChart's pie reads from `value`
  const pieData = data.map((d) => ({ name: d.name, value: Math.max(0, d.value) }));

  return (
    <SleekChart
      kind="pie"
      data={pieData}
      xKey="name"
      series={[{ key: 'value', label: 'Value' }]}
      title={title}
      subtitle="Composition breakdown"
      kpi={formatCurrency(total)}
      valueFormatter={formatCurrency}
      compactHeight={140}
      expandedHeight={360}
      emptyLabel="No data available"
    />
  );
};
