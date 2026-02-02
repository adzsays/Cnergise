import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useAccounting, TrialBalanceRow } from '@/hooks/useAccounting';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const TrialBalanceView = () => {
  const { accounts } = useFinancialData();
  const { accountingPeriods, calculateTrialBalance, journalEntries, journalEntryLines } = useAccounting();
  
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const selectedPeriod = accountingPeriods.find(p => p.id === selectedPeriodId);

  // Transform accounts with required fields
  const accountsForTrialBalance = useMemo(() => {
    return accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      account_code: (acc as any).account_code || null,
      account_class: (acc as any).account_class || 
        (acc.type === 'asset' ? 'asset' : acc.type === 'liability' ? 'liability' : null),
      opening_balance: (acc as any).opening_balance || 0,
      opening_balance_date: (acc as any).opening_balance_date || null,
    }));
  }, [accounts]);

  const trialBalanceData = useMemo(() => {
    const periodStart = selectedPeriod ? new Date(selectedPeriod.start_date) : undefined;
    return calculateTrialBalance(accountsForTrialBalance, asOfDate, periodStart);
  }, [accountsForTrialBalance, asOfDate, selectedPeriod, journalEntries, journalEntryLines]);

  const filteredData = useMemo(() => {
    if (filterClass === 'all') return trialBalanceData;
    return trialBalanceData.filter(row => row.account_class === filterClass);
  }, [trialBalanceData, filterClass]);

  // Group by account class
  const groupedData = useMemo(() => {
    const groups: Record<string, TrialBalanceRow[]> = {
      asset: [],
      liability: [],
      equity: [],
      income: [],
      expense: [],
      unclassified: [],
    };

    filteredData.forEach(row => {
      const classKey = row.account_class || 'unclassified';
      if (groups[classKey]) {
        groups[classKey].push(row);
      } else {
        groups.unclassified.push(row);
      }
    });

    return groups;
  }, [filteredData]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => ({
        opening_debit: acc.opening_debit + row.opening_debit,
        opening_credit: acc.opening_credit + row.opening_credit,
        period_debit: acc.period_debit + row.period_debit,
        period_credit: acc.period_credit + row.period_credit,
        closing_debit: acc.closing_debit + row.closing_debit,
        closing_credit: acc.closing_credit + row.closing_credit,
      }),
      { opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 0 }
    );
  }, [filteredData]);

  const isBalanced = Math.abs(totals.closing_debit - totals.closing_credit) < 0.01;

  const renderAccountGroup = (title: string, rows: TrialBalanceRow[], colorClass: string) => {
    if (rows.length === 0) return null;
    
    const groupTotals = rows.reduce(
      (acc, row) => ({
        opening_debit: acc.opening_debit + row.opening_debit,
        opening_credit: acc.opening_credit + row.opening_credit,
        period_debit: acc.period_debit + row.period_debit,
        period_credit: acc.period_credit + row.period_credit,
        closing_debit: acc.closing_debit + row.closing_debit,
        closing_credit: acc.closing_credit + row.closing_credit,
      }),
      { opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 0 }
    );

    return (
      <>
        <TableRow className={cn("font-semibold", colorClass)}>
          <TableCell colSpan={7} className="text-sm uppercase tracking-wide">
            {title}
          </TableCell>
        </TableRow>
        {rows.map(row => (
          <TableRow key={row.account_id}>
            <TableCell className="pl-6">
              {row.account_code && <span className="text-muted-foreground mr-2">{row.account_code}</span>}
              {row.account_name}
            </TableCell>
            <TableCell className="text-right">{row.opening_debit ? formatCurrency(row.opening_debit) : '-'}</TableCell>
            <TableCell className="text-right">{row.opening_credit ? formatCurrency(row.opening_credit) : '-'}</TableCell>
            <TableCell className="text-right">{row.period_debit ? formatCurrency(row.period_debit) : '-'}</TableCell>
            <TableCell className="text-right">{row.period_credit ? formatCurrency(row.period_credit) : '-'}</TableCell>
            <TableCell className="text-right">{row.closing_debit ? formatCurrency(row.closing_debit) : '-'}</TableCell>
            <TableCell className="text-right">{row.closing_credit ? formatCurrency(row.closing_credit) : '-'}</TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/30">
          <TableCell className="pl-6 font-medium">Subtotal {title}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(groupTotals.opening_debit)}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(groupTotals.opening_credit)}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(groupTotals.period_debit)}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(groupTotals.period_credit)}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(groupTotals.closing_debit)}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(groupTotals.closing_credit)}</TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm md:text-base">Trial Balance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* As of Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">As of Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[180px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(asOfDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={asOfDate}
                    onSelect={(date) => date && setAsOfDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Accounting Period */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Accounting Period</label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All time</SelectItem>
                  {accountingPeriods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Class */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Filter by Type</label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="liability">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            <Button variant="outline" size="sm" className="self-end">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base">
              Six-Column Trial Balance
              {selectedPeriod && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({format(new Date(selectedPeriod.start_date), 'PP')} - {format(new Date(selectedPeriod.end_date), 'PP')})
                </span>
              )}
            </CardTitle>
            <div className={cn(
              "text-xs px-2 py-1 rounded-full",
              isBalanced ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {isBalanced ? '✓ Balanced' : '✗ Out of Balance'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Account</TableHead>
                  <TableHead colSpan={2} className="text-center border-l">Opening Balance</TableHead>
                  <TableHead colSpan={2} className="text-center border-l">Period Movement</TableHead>
                  <TableHead colSpan={2} className="text-center border-l">Closing Balance</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead className="text-right border-l">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right border-l">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right border-l">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No account activity found. Add accounts and transactions to see the trial balance.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {renderAccountGroup('Assets', groupedData.asset, 'bg-blue-50 dark:bg-blue-950/20')}
                    {renderAccountGroup('Liabilities', groupedData.liability, 'bg-orange-50 dark:bg-orange-950/20')}
                    {renderAccountGroup('Equity', groupedData.equity, 'bg-purple-50 dark:bg-purple-950/20')}
                    {renderAccountGroup('Income', groupedData.income, 'bg-green-50 dark:bg-green-950/20')}
                    {renderAccountGroup('Expenses', groupedData.expense, 'bg-red-50 dark:bg-red-950/20')}
                    {renderAccountGroup('Unclassified', groupedData.unclassified, 'bg-gray-50 dark:bg-gray-950/20')}
                    
                    {/* Grand Totals */}
                    <TableRow className="font-bold border-t-2 bg-muted">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.opening_debit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.opening_credit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.period_debit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.period_credit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.closing_debit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.closing_credit)}</TableCell>
                    </TableRow>
                    
                    {/* Difference row if not balanced */}
                    {!isBalanced && (
                      <TableRow className="text-red-600 dark:text-red-400">
                        <TableCell>Difference</TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell colSpan={2} className="text-right">
                          {formatCurrency(Math.abs(totals.closing_debit - totals.closing_credit))}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
