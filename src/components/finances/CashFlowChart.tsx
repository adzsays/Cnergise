import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface CashFlowChartProps {
  transactions: any[];
}

export const CashFlowChart = ({ transactions }: CashFlowChartProps) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const monthlyData: { [key: string]: { income: number; expense: number; net: number } } = {};

    // Initialize 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { income: 0, expense: 0, net: 0 };
    }

    // Aggregate transactions by month
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      
      if (monthlyData[monthKey]) {
        if (t.type === 'income') {
          monthlyData[monthKey].income += t.monthly || t.amount;
        } else if (t.type === 'expense') {
          monthlyData[monthKey].expense += t.monthly || t.amount;
        }
      }
    });

    // Calculate net and project forward
    let runningBalance = 0;
    return Object.entries(monthlyData).map(([month, data]) => {
      const net = data.income - data.expense;
      runningBalance += net;
      return {
        month,
        income: Math.round(data.income),
        expense: Math.round(data.expense),
        net: Math.round(net),
        balance: Math.round(runningBalance),
      };
    });
  }, [transactions]);

  const chartConfig = {
    income: {
      label: 'Income',
      color: 'hsl(var(--chart-2))',
    },
    expense: {
      label: 'Expenses',
      color: 'hsl(var(--chart-1))',
    },
    balance: {
      label: 'Running Balance',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card>
      <CardHeader className="px-3 md:px-6">
        <CardTitle className="text-sm md:text-base">12-Month Cash Flow Projection</CardTitle>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        <ChartContainer config={chartConfig} className="h-[250px] md:h-[400px]">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[350px] h-[250px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                    width={35}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-income)"
                    strokeWidth={2}
                    dot={false}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--color-expense)"
                    strokeWidth={2}
                    dot={false}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--color-balance)"
                    strokeWidth={3}
                    dot={false}
                    name="Running Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
