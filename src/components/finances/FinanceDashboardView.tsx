import React from 'react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp, Wallet, CreditCard } from 'lucide-react';
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
  
  const cashFlowProjections = monthLabels.map((_, monthIndex) => {
    return transactions.reduce((sum, t) => {
      const projection = Array.isArray(t.projections) ? t.projections[monthIndex] : t.monthly;
      return sum + (projection || 0);
    }, 0);
  });
  
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
      <div className="space-y-6">
        <SkeletonCard lines={4} />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Net Worth Hero */}
      <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide uppercase">Net Worth</p>
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mt-1">{formatCurrency(balanceSheetSummary.netWorth)}</h1>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium w-fit ${trend === 'up' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
            {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            <span>{trend === 'up' ? '+' : ''}{formatCurrency(projection12M)}</span>
            <span className="text-[10px] md:text-xs opacity-70">12mo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Available Cash</p>
              <p className="text-sm md:text-lg font-semibold">{formatCurrency(balanceSheetSummary.availableCash)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Credit Available</p>
              <p className="text-sm md:text-lg font-semibold">{formatCurrency(balanceSheetSummary.availableCredit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="rounded-lg md:rounded-xl border border-income/20 bg-income/5 p-3 md:p-5">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">Income</span>
            <div className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg bg-income/10 flex items-center justify-center">
              <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-income" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-semibold text-income">{formatCurrency(totalIncome)}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            {transactions.filter(t => t.type === 'income').length} sources
          </p>
        </div>

        <div className="rounded-lg md:rounded-xl border border-expense/20 bg-expense/5 p-3 md:p-5">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">Expenses</span>
            <div className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg bg-expense/10 flex items-center justify-center">
              <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-expense" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-semibold text-expense">{formatCurrency(totalExpenses)}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            {transactions.filter(t => t.type === 'expense').length} categories
          </p>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className="rounded-lg md:rounded-xl border border-border/50 p-4 md:p-5 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Net Monthly Cash Flow</p>
            <p className={`text-xl md:text-3xl font-semibold ${netCashFlow >= 0 ? 'text-income' : 'text-expense'}`}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
            </p>
          </div>
          <div className={`h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center ${netCashFlow >= 0 ? 'bg-income/10' : 'bg-expense/10'}`}>
            {netCashFlow >= 0 ? (
              <TrendingUp className="h-5 w-5 md:h-7 md:w-7 text-income" />
            ) : (
              <TrendingDown className="h-5 w-5 md:h-7 md:w-7 text-expense" />
            )}
          </div>
        </div>
      </div>

      {/* Assets & Liabilities */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="rounded-lg md:rounded-xl border border-border/50 p-3 md:p-4">
          <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-1 md:mb-2">Total Assets</p>
          <p className="text-base md:text-xl font-semibold text-income">
            {formatCurrency(balanceSheetSummary.totalAssets)}
          </p>
        </div>

        <div className="rounded-lg md:rounded-xl border border-border/50 p-3 md:p-4">
          <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-1 md:mb-2">Total Liabilities</p>
          <p className="text-base md:text-xl font-semibold text-expense">
            {formatCurrency(balanceSheetSummary.totalLiabilities)}
          </p>
        </div>
      </div>
    </div>
  );
};
