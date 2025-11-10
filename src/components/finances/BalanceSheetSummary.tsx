import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface BalanceSheetSummaryProps {
  summary: {
    assets: number;
    liabilities: number;
    netWorth: number;
  };
}

export const BalanceSheetSummary = ({ summary }: BalanceSheetSummaryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-2">{formatCurrency(summary.assets)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Cash, investments, and property
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">{formatCurrency(summary.liabilities)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Debts, loans, and credit cards
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.netWorth >= 0 ? 'text-chart-2' : 'text-chart-1'}`}>
            {formatCurrency(summary.netWorth)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Assets minus liabilities
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
