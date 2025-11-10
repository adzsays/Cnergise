import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';

interface AccountsTableProps {
  accounts: any[];
  loading: boolean;
  onEdit: (account: any) => void;
}

export const AccountsTable = ({ accounts, loading, onEdit }: AccountsTableProps) => {
  const { refreshData } = useFinancialData();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete account');
      console.error(error);
      return;
    }

    toast.success('Account deleted');
    refreshData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>;
  }

  if (accounts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No accounts found. Add your first account to get started.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Group</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Credit Limit</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>
                <Badge variant={account.type === 'asset' ? 'default' : 'secondary'}>
                  {account.type}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{account.category || '-'}</TableCell>
              <TableCell className="text-muted-foreground">{account.group_name}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {account.credit_limit ? formatCurrency(account.credit_limit) : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
