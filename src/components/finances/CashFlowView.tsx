import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Upload } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { TransactionDialog } from './TransactionDialog';
import { TransactionTable } from './TransactionTable';
import { CashFlowChart } from './CashFlowChart';
import { CategoryFilter } from './CategoryFilter';
import { ImportDialog } from './ImportDialog';

export const CashFlowView = () => {
  const { transactions, loading } = useFinancialData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;
      const typeMatch = selectedType === 'all' || t.type === selectedType;
      return categoryMatch && typeMatch;
    });
  }, [transactions, selectedCategory, selectedType]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <Button
            variant="outline"
            onClick={() => setSelectedType(selectedType === 'all' ? 'income' : selectedType === 'income' ? 'expense' : 'all')}
          >
            <Filter className="mr-2 h-4 w-4" />
            {selectedType === 'all' ? 'All Types' : selectedType === 'income' ? 'Income' : 'Expenses'}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <CashFlowChart transactions={filteredTransactions} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={filteredTransactions} loading={loading} />
        </CardContent>
      </Card>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </div>
  );
};
