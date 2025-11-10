import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
];

const ASSET_CATEGORIES = ['Cash', 'Bank Account', 'Investment', 'Property', 'Vehicle', 'Other'];
const LIABILITY_CATEGORIES = ['Credit Card', 'Loan', 'Mortgage', 'Other'];

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: any;
}

export const AccountDialog = ({ open, onOpenChange, account }: AccountDialogProps) => {
  const { refreshData } = useFinancialData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'asset',
    category: '',
    group_name: 'General',
    balance: '',
    currency: 'GBP',
    credit_limit: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        type: account.type || 'asset',
        category: account.category || '',
        group_name: account.group_name || 'General',
        balance: account.balance?.toString() || '',
        currency: account.currency || 'GBP',
        credit_limit: account.credit_limit?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'asset',
        category: '',
        group_name: 'General',
        balance: '',
        currency: 'GBP',
        credit_limit: '',
      });
    }
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      setLoading(false);
      return;
    }

    const accountData = {
      user_id: user.id,
      name: formData.name,
      type: formData.type,
      category: formData.category,
      group_name: formData.group_name,
      balance: parseFloat(formData.balance) || 0,
      currency: formData.currency,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
    };

    const { error } = account?.id
      ? await supabase.from('financial_accounts').update(accountData).eq('id', account.id)
      : await supabase.from('financial_accounts').insert([accountData]);

    setLoading(false);

    if (error) {
      toast.error('Failed to save account');
      console.error(error);
      return;
    }

    toast.success(account?.id ? 'Account updated' : 'Account added');
    onOpenChange(false);
    refreshData();
  };

  const categories = formData.type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account?.id ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Bank Account"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div>
            <Label htmlFor="balance">Current Balance (£)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              required
            />
          </div>

          {formData.type === 'liability' && (
            <div>
              <Label htmlFor="credit_limit">Credit Limit (£)</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                placeholder="Optional"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
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
