import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, CalendarIcon, Settings } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useAccounting } from '@/hooks/useAccounting';
import { AccountDialog } from './AccountDialog';
import { AccountsTable } from './AccountsTable';
import { BalanceSheetSummary } from './BalanceSheetSummary';
import { NetWorthChart } from './NetWorthChart';
import { ImportDialog } from './ImportDialog';
import { AccountingPeriodsDialog } from './AccountingPeriodsDialog';

export const BalanceSheetView = () => {
  const { accounts, loading } = useFinancialData();
  const { journalEntries, journalEntryLines } = useAccounting();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPeriodsOpen, setIsPeriodsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());

  // Calculate balances as of selected date
  const summary = useMemo(() => {
    // Filter accounts and calculate balances up to asOfDate
    const filteredAccounts = accounts.map(acc => {
      // Get journal entry lines for this account up to asOfDate
      const relevantEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate <= asOfDate;
      });
      const relevantEntryIds = new Set(relevantEntries.map(e => e.id));
      
      const accountLines = journalEntryLines.filter(
        line => line.account_id === acc.id && relevantEntryIds.has(line.journal_entry_id)
      );
      
      // Calculate balance from journal entries
      const journalBalance = accountLines.reduce((sum, line) => {
        return sum + Number(line.debit_amount) - Number(line.credit_amount);
      }, 0);
      
      // Add opening balance
      const openingBalance = (acc as any).opening_balance || 0;
      const openingDate = (acc as any).opening_balance_date;
      
      let totalBalance = Number(acc.balance);
      
      // If we have journal entries, use those instead
      if (accountLines.length > 0 || openingBalance !== 0) {
        if (!openingDate || new Date(openingDate) <= asOfDate) {
          totalBalance = openingBalance + journalBalance;
        }
      }
      
      return { ...acc, calculatedBalance: totalBalance };
    });

    const assets = filteredAccounts
      .filter((a) => a.type === 'asset')
      .reduce((sum, a) => sum + a.calculatedBalance, 0);
    
    const liabilities = filteredAccounts
      .filter((a) => a.type === 'liability')
      .reduce((sum, a) => sum + Math.abs(a.calculatedBalance), 0);
    
    const netWorth = assets - liabilities;

    const assetsByCategory = filteredAccounts
      .filter((a) => a.type === 'asset')
      .reduce((acc, a) => {
        const cat = a.category || 'Other';
        acc[cat] = (acc[cat] || 0) + a.calculatedBalance;
        return acc;
      }, {} as Record<string, number>);

    const liabilitiesByCategory = filteredAccounts
      .filter((a) => a.type === 'liability')
      .reduce((acc, a) => {
        const cat = a.category || 'Other';
        acc[cat] = (acc[cat] || 0) + Math.abs(a.calculatedBalance);
        return acc;
      }, {} as Record<string, number>);

    return { assets, liabilities, netWorth, assetsByCategory, liabilitiesByCategory };
  }, [accounts, asOfDate, journalEntries, journalEntryLines]);

  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Date Selector */}
      <Card>
        <CardContent className="py-3 px-3 md:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Balance Sheet as of:</span>
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
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setIsPeriodsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Accounting Periods</span>
              <span className="sm:hidden">Periods</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <BalanceSheetSummary summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <NetWorthChart
          data={Object.entries(summary.assetsByCategory).map(([name, value]) => ({
            name,
            value,
          }))}
          title="Assets Breakdown"
          color="hsl(var(--chart-2))"
        />
        <NetWorthChart
          data={Object.entries(summary.liabilitiesByCategory).map(([name, value]) => ({
            name,
            value,
          }))}
          title="Liabilities Breakdown"
          color="hsl(var(--chart-1))"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 md:px-6">
          <CardTitle className="text-sm md:text-base">Accounts</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="text-xs md:text-sm">
              <Upload className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button size="sm" onClick={handleAddNew} className="text-xs md:text-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <div className="overflow-x-auto">
            <AccountsTable
              accounts={accounts}
              loading={loading}
              onEdit={handleEdit}
            />
          </div>
        </CardContent>
      </Card>

      <AccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        account={selectedAccount}
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <AccountingPeriodsDialog
        open={isPeriodsOpen}
        onOpenChange={setIsPeriodsOpen}
      />
    </div>
  );
};
