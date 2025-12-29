import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Wallet, CreditCard, Landmark, Bitcoin, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { AccountDialog } from './AccountDialog';
import { SkeletonCard } from '@/components/ui/DashboardWidget';
import { cn } from '@/lib/utils';

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  'bank': <Building2 className="h-5 w-5" />,
  'digital_wallet': <Wallet className="h-5 w-5" />,
  'credit_card': <CreditCard className="h-5 w-5" />,
  'investment': <Landmark className="h-5 w-5" />,
  'crypto': <Bitcoin className="h-5 w-5" />,
  'savings': <PiggyBank className="h-5 w-5" />,
  'default': <Wallet className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'bank': 'bg-blue-500/10 text-blue-600',
  'digital_wallet': 'bg-purple-500/10 text-purple-600',
  'credit_card': 'bg-orange-500/10 text-orange-600',
  'investment': 'bg-green-500/10 text-green-600',
  'crypto': 'bg-yellow-500/10 text-yellow-600',
  'savings': 'bg-teal-500/10 text-teal-600',
  'default': 'bg-muted text-muted-foreground',
};

const formatCurrency = (amount: number, currency: string = 'GBP') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const AccountBalancesView = () => {
  const { accounts, loading, refreshData } = useFinancialData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, typeof accounts> = {
      'Bank Accounts': [],
      'Digital Wallets': [],
      'Credit Cards': [],
      'Investments': [],
      'Crypto': [],
      'Savings': [],
      'Other': [],
    };

    accounts.forEach((account) => {
      const category = account.category?.toLowerCase() || account.group_name?.toLowerCase() || 'other';
      
      if (category.includes('bank')) {
        groups['Bank Accounts'].push(account);
      } else if (category.includes('wallet') || category.includes('digital')) {
        groups['Digital Wallets'].push(account);
      } else if (category.includes('credit') || category.includes('card')) {
        groups['Credit Cards'].push(account);
      } else if (category.includes('invest') || category.includes('stock') || category.includes('fund')) {
        groups['Investments'].push(account);
      } else if (category.includes('crypto') || category.includes('bitcoin')) {
        groups['Crypto'].push(account);
      } else if (category.includes('saving')) {
        groups['Savings'].push(account);
      } else {
        groups['Other'].push(account);
      }
    });

    // Filter out empty groups
    return Object.entries(groups).filter(([_, accs]) => accs.length > 0);
  }, [accounts]);

  const totals = useMemo(() => {
    const totalAssets = accounts
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + Number(a.balance), 0);
    
    const totalLiabilities = accounts
      .filter(a => a.type === 'liability')
      .reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0);

    const netWorth = totalAssets - totalLiabilities;

    return { totalAssets, totalLiabilities, netWorth };
  }, [accounts]);

  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  const getIconForCategory = (category: string) => {
    const key = category.toLowerCase().replace(' ', '_');
    if (key.includes('bank')) return ACCOUNT_ICONS['bank'];
    if (key.includes('wallet') || key.includes('digital')) return ACCOUNT_ICONS['digital_wallet'];
    if (key.includes('credit') || key.includes('card')) return ACCOUNT_ICONS['credit_card'];
    if (key.includes('invest')) return ACCOUNT_ICONS['investment'];
    if (key.includes('crypto')) return ACCOUNT_ICONS['crypto'];
    if (key.includes('saving')) return ACCOUNT_ICONS['savings'];
    return ACCOUNT_ICONS['default'];
  };

  const getCategoryColor = (category: string) => {
    const key = category.toLowerCase().replace(' ', '_');
    if (key.includes('bank')) return CATEGORY_COLORS['bank'];
    if (key.includes('wallet') || key.includes('digital')) return CATEGORY_COLORS['digital_wallet'];
    if (key.includes('credit') || key.includes('card')) return CATEGORY_COLORS['credit_card'];
    if (key.includes('invest')) return CATEGORY_COLORS['investment'];
    if (key.includes('crypto')) return CATEGORY_COLORS['crypto'];
    if (key.includes('saving')) return CATEGORY_COLORS['savings'];
    return CATEGORY_COLORS['default'];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <SkeletonCard lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-border rounded-md shadow-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Assets</p>
                <p className="text-2xl font-semibold tabular-nums text-success mt-1">
                  {formatCurrency(totals.totalAssets)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border rounded-md shadow-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Liabilities</p>
                <p className="text-2xl font-semibold tabular-nums text-destructive mt-1">
                  {formatCurrency(totals.totalLiabilities)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border rounded-md shadow-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Net Worth</p>
                <p className={cn(
                  "text-2xl font-semibold tabular-nums mt-1",
                  totals.netWorth >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(totals.netWorth)}
                </p>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                totals.netWorth >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                <Wallet className={cn(
                  "h-5 w-5",
                  totals.netWorth >= 0 ? "text-success" : "text-destructive"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Account Button */}
      <div className="flex justify-end">
        <Button onClick={handleAddNew} size="sm" className="h-9">
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Account Groups */}
      {groupedAccounts.length > 0 ? (
        groupedAccounts.map(([groupName, groupAccounts]) => (
          <Card key={groupName} className="bg-card border border-border rounded-md shadow-card">
            <CardHeader className="px-4 py-4 md:px-6 pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <span className={cn("p-2 rounded-md", getCategoryColor(groupName))}>
                  {getIconForCategory(groupName)}
                </span>
                {groupName}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {groupAccounts.length} {groupAccounts.length === 1 ? 'account' : 'accounts'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6">
              <div className="space-y-2">
                {groupAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleEdit(account)}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border">
                        <span className="text-xs font-medium">{account.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.group_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-medium tabular-nums",
                        account.type === 'liability' ? "text-destructive" : "text-foreground"
                      )}>
                        {account.type === 'liability' ? '-' : ''}{formatCurrency(Math.abs(Number(account.balance)), account.currency)}
                      </p>
                      {account.credit_limit && (
                        <p className="text-xs text-muted-foreground">
                          Limit: {formatCurrency(account.credit_limit, account.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Group Total */}
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(
                      groupAccounts.reduce((sum, a) => 
                        sum + (a.type === 'liability' ? -Math.abs(Number(a.balance)) : Number(a.balance)), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="bg-card border border-border rounded-md shadow-card">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium mb-1">No accounts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your bank accounts, digital wallets, and credit cards to track your finances.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      )}

      <AccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        account={selectedAccount}
      />
    </div>
  );
};
