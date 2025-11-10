import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';

interface TransactionTableProps {
  transactions: any[];
  loading: boolean;
}

export const TransactionTable = ({ transactions, loading }: TransactionTableProps) => {
  const { refreshData } = useFinancialData();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete transaction');
      console.error(error);
      return;
    }

    toast.success('Transaction deleted');
    refreshData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No transactions found</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Subcategory</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Monthly</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell className="text-muted-foreground">{transaction.subcategory || '-'}</TableCell>
              <TableCell>
                <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(transaction.monthly)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(transaction.id)}
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
