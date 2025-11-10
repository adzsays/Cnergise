import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { AccountDialog } from './AccountDialog';
import { AccountsTable } from './AccountsTable';
import { BalanceSheetSummary } from './BalanceSheetSummary';
import { NetWorthChart } from './NetWorthChart';

export const BalanceSheetView = () => {
  const { accounts, loading } = useFinancialData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    <div className="space-y-6">
      <BalanceSheetSummary summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Accounts</CardTitle>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent>
          <AccountsTable
            accounts={accounts}
            loading={loading}
            onEdit={handleEdit}
          />
        </CardContent>
      </Card>

      <AccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        account={selectedAccount}
      />
    </div>
  );
};
