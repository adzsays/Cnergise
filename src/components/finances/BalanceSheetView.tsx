import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { AccountDialog } from './AccountDialog';
import { AccountsTable } from './AccountsTable';
import { BalanceSheetSummary } from './BalanceSheetSummary';
import { NetWorthChart } from './NetWorthChart';
import { ImportDialog } from './ImportDialog';

export const BalanceSheetView = () => {
  const { accounts, loading } = useFinancialData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const summary = useMemo(() => {
    const assets = accounts
      .filter((a) => a.type === 'asset')
      .reduce((sum, a) => sum + Number(a.balance), 0);
    
    const liabilities = accounts
      .filter((a) => a.type === 'liability')
      .reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0);
    
    const netWorth = assets - liabilities;

    const assetsByCategory = accounts
      .filter((a) => a.type === 'asset')
      .reduce((acc, a) => {
        const cat = a.category || 'Other';
        acc[cat] = (acc[cat] || 0) + Number(a.balance);
        return acc;
      }, {} as Record<string, number>);

    const liabilitiesByCategory = accounts
      .filter((a) => a.type === 'liability')
      .reduce((acc, a) => {
        const cat = a.category || 'Other';
        acc[cat] = (acc[cat] || 0) + Math.abs(Number(a.balance));
        return acc;
      }, {} as Record<string, number>);

    return { assets, liabilities, netWorth, assetsByCategory, liabilitiesByCategory };
  }, [accounts]);

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
    </div>
  );
};
