import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { 
  getDayOfPeriodLabel, 
  getMaxDayOfPeriod, 
  getWeekdayOptions,
  getNextBusinessDay 
} from '@/utils/businessDays';

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

// Extract day of period from stored timestamp based on frequency
const extractDayOfPeriod = (timestamp: number, frequency: string): number => {
  const date = new Date(timestamp);
  switch (frequency) {
    case 'weekly':
      return date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday to 7
    case 'monthly':
    case 'quarterly':
    case 'yearly':
      return date.getDate();
    default:
      return date.getDate();
  }
};

export const TransactionDialog = ({ open, onOpenChange, transaction }: TransactionDialogProps) => {
  const { refreshData } = useFinancialData();
  const [loading, setLoading] = useState(false);
  
  const initialFrequency = transaction?.frequency || 'one-time';
  const initialDayOfPeriod = transaction?.date 
    ? extractDayOfPeriod(transaction.date, initialFrequency) 
    : new Date().getDate();

  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    category: transaction?.category || '',
    subcategory: transaction?.subcategory || '',
    group_name: transaction?.group_name || 'General',
    amount: transaction?.amount?.toString() || '',
    dayOfPeriod: initialDayOfPeriod,
    oneTimeDate: transaction?.date && initialFrequency === 'one-time' 
      ? new Date(transaction.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    percentage: transaction?.percentage || 0,
    cost_centre: transaction?.cost_centre || 'General',
    frequency: initialFrequency,
  });

  const isRecurring = formData.frequency !== 'one-time' && formData.frequency !== 'daily';
  const weekdayOptions = useMemo(() => getWeekdayOptions(), []);

  // Calculate timestamp from day of period or one-time date
  const calculateDateTimestamp = (): number => {
    if (formData.frequency === 'one-time') {
      // For one-time transactions, use the actual date and adjust to next business day
      const date = new Date(formData.oneTimeDate);
      const businessDate = getNextBusinessDay(date);
      return businessDate.getTime();
    }
    
    if (formData.frequency === 'daily') {
      // Daily transactions use today as reference
      return new Date().getTime();
    }
    
    // For recurring transactions, store a reference date with the day of period
    // This allows us to extract the recurring day later
    const now = new Date();
    let referenceDate: Date;
    
    if (formData.frequency === 'weekly') {
      // For weekly, set to the next occurrence of that weekday
      const currentDay = now.getDay() || 7;
      const targetDay = formData.dayOfPeriod;
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      referenceDate = new Date(now);
      referenceDate.setDate(now.getDate() + daysUntil);
    } else {
      // For monthly/quarterly/yearly, use a date with that day of month
      referenceDate = new Date(now.getFullYear(), now.getMonth(), formData.dayOfPeriod);
    }
    
    return referenceDate.getTime();
  };

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
    const dateTimestamp = calculateDateTimestamp();
    
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{transaction?.id ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
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
                <SelectContent className="bg-background z-50">
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
                <SelectContent className="bg-background z-50">
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
                <SelectContent className="bg-background z-50">
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

            {formData.frequency === 'one-time' ? (
              <div>
                <Label htmlFor="oneTimeDate">Transaction Date</Label>
                <Input
                  id="oneTimeDate"
                  type="date"
                  value={formData.oneTimeDate}
                  onChange={(e) => setFormData({ ...formData, oneTimeDate: e.target.value })}
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Adjusted to next business day if weekend/holiday
                </p>
              </div>
            ) : formData.frequency === 'daily' ? (
              <div>
                <Label>Schedule</Label>
                <p className="text-sm text-muted-foreground py-2">
                  Repeats every business day
                </p>
              </div>
            ) : formData.frequency === 'weekly' ? (
              <div>
                <Label>{getDayOfPeriodLabel(formData.frequency)}</Label>
                <Select 
                  value={formData.dayOfPeriod.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, dayOfPeriod: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {weekdayOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Moves to next business day if needed
                </p>
              </div>
            ) : (
              <div>
                <Label>{getDayOfPeriodLabel(formData.frequency)}</Label>
                <Input
                  type="number"
                  min="1"
                  max={getMaxDayOfPeriod(formData.frequency)}
                  value={formData.dayOfPeriod}
                  onChange={(e) => setFormData({ ...formData, dayOfPeriod: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formData.frequency === 'monthly' && 'e.g., 15 = 15th of each month'}
                  {formData.frequency === 'quarterly' && 'e.g., 45 = 45th day of quarter'}
                  {formData.frequency === 'yearly' && 'e.g., 100 = 100th day of year'}
                  {' '}• Adjusted to business day
                </p>
              </div>
            )}
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
