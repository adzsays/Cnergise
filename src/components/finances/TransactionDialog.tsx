import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Other Income'],
  expense: ['Rent', 'Utilities', 'Groceries', 'Transport', 'Entertainment', 'Healthcare', 'Other Expense'],
  transfer: ['Account Transfer'],
};

const FREQUENCIES = [
  { value: 'one-time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const COST_CENTRES = [
  'General',
  'Operations',
  'Marketing',
  'Sales',
  'IT & Technology',
  'Human Resources',
  'Finance',
  'Research & Development',
  'Customer Service',
  'Administration',
  'Other',
];

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any;
}

export const TransactionDialog = ({ open, onOpenChange, transaction }: TransactionDialogProps) => {
  const { refreshData } = useFinancialData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    category: transaction?.category || '',
    subcategory: transaction?.subcategory || '',
    group_name: transaction?.group_name || 'General',
    amount: transaction?.amount?.toString() || '',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    percentage: transaction?.percentage || 0,
    cost_centre: transaction?.cost_centre || 'General',
    frequency: transaction?.frequency || 'one-time',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    const dateTimestamp = new Date(formData.date).getTime();
    
    const monthly = amount;
    const daily = amount / 30;

    const transactionData = {
      user_id: user.id,
      type: formData.type,
      category: formData.category,
      subcategory: formData.subcategory,
      group_name: formData.group_name,
      amount,
      date: dateTimestamp,
      percentage: formData.percentage,
      daily,
      monthly,
      projections: [],
      cost_centre: formData.cost_centre,
      frequency: formData.frequency,
    };

    const { error } = transaction?.id
      ? await supabase.from('financial_transactions').update(transactionData).eq('id', transaction.id)
      : await supabase.from('financial_transactions').insert([transactionData]);

    setLoading(false);

    if (error) {
      toast.error('Failed to save transaction');
      console.error(error);
      return;
    }

    toast.success(transaction?.id ? 'Transaction updated' : 'Transaction added');
    onOpenChange(false);
    refreshData();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction?.id ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[formData.type as keyof typeof CATEGORIES]?.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cost_centre">Cost Centre</Label>
              <Select value={formData.cost_centre} onValueChange={(value) => setFormData({ ...formData, cost_centre: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cost centre" />
                </SelectTrigger>
                <SelectContent>
                  {COST_CENTRES.map((centre) => (
                    <SelectItem key={centre} value={centre}>
                      {centre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="group_name">Group</Label>
            <Input
              id="group_name"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
