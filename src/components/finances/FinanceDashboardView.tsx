import React from 'react';
import { Card } from '@/components/ui/card';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, Wallet, CreditCard, Building2 } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/DashboardWidget';

export const FinanceDashboardView = () => {
  const { transactions, balanceSheetSummary, loading, monthLabels } = useFinancialData();
  
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.monthly, 0);

  const totalExpenses = Math.abs(
    transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.monthly, 0)
  );

  const netCashFlow = totalIncome - totalExpenses;
  
  // Calculate 12-month projection
  const cashFlowProjections = monthLabels.map((_, monthIndex) => {
    return transactions.reduce((sum, t) => {
      const projection = Array.isArray(t.projections) ? t.projections[monthIndex] : t.monthly;
      return sum + (projection || 0);
    }, 0);
  });
  
  const currentMonth = cashFlowProjections[0] || 0;
  const projection12M = cashFlowProjections.reduce((sum, val) => sum + val, 0);
  const trend = projection12M >= 0 ? 'up' : 'down';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={4} />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Net Worth</p>
            <h1 className="text-4xl font-bold">{formatCurrency(balanceSheetSummary.netWorth)}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90 mb-1">Available Cash</p>
            <p className="text-2xl font-semibold">{formatCurrency(balanceSheetSummary.availableCash)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs opacity-90 mb-1">Credit Available</p>
            <p className="text-lg font-semibold">{formatCurrency(balanceSheetSummary.availableCredit)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs opacity-90 mb-1">12M Projection</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              {formatCurrency(projection12M)}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
            </p>
          </div>
        </div>
      </Card>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-l-4 border-l-income">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-muted-foreground">Monthly Income</p>
            <ArrowUp className="h-4 w-4 text-income" />
          </div>
          <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {transactions.filter(t => t.type === 'income').length} income sources
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-expense">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-muted-foreground">Monthly Expenses</p>
            <ArrowDown className="h-4 w-4 text-expense" />
          </div>
          <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {transactions.filter(t => t.type === 'expense').length} expense categories
          </p>
        </Card>
      </div>

      {/* Net Cash Flow */}
      <Card className="p-6 bg-gradient-to-br from-secondary to-secondary/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Net Monthly Cash Flow</p>
            <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-income' : 'text-expense'}`}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
            </p>
          </div>
          {netCashFlow >= 0 ? (
            <TrendingUp className="h-12 w-12 text-income" />
          ) : (
            <TrendingDown className="h-12 w-12 text-expense" />
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Assets</p>
          </div>
          <p className="text-2xl font-bold text-income">
            {formatCurrency(balanceSheetSummary.totalAssets)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Liabilities</p>
          </div>
          <p className="text-2xl font-bold text-expense">
            {formatCurrency(balanceSheetSummary.totalLiabilities)}
          </p>
        </Card>
      </div>
    </div>
  );
};
