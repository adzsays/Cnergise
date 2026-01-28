import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSpaceFilter } from '@/hooks/useSpaceFilter';

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
];

const ASSET_CATEGORIES = ['Bank Account', 'Digital Wallet', 'Cash', 'Savings', 'Investment', 'Crypto', 'Property', 'Vehicle', 'Other'];
const LIABILITY_CATEGORIES = ['Credit Card', 'Loan', 'Mortgage', 'Overdraft', 'Other'];

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: any;
}

export const AccountDialog = ({ open, onOpenChange, account }: AccountDialogProps) => {
  const { refreshData } = useFinancialData();
  const { spaces, getDefaultSpaceId } = useSpaceFilter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'asset',
    category: '',
    space_id: '',
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
        space_id: account.space_id || getDefaultSpaceId() || '',
        balance: account.balance?.toString() || '',
        currency: account.currency || 'GBP',
        credit_limit: account.credit_limit?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'asset',
        category: '',
        space_id: getDefaultSpaceId() || '',
        balance: '',
        currency: 'GBP',
        credit_limit: '',
      });
    }
  }, [account, open, getDefaultSpaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      setLoading(false);
      return;
    }

    // Get space name for group_name field (backward compatibility)
    const selectedSpace = spaces.find(s => s.id === formData.space_id);
    const spaceName = selectedSpace?.name || 'General';
    
    const accountData = {
      user_id: user.id,
      name: formData.name,
      type: formData.type,
      category: formData.category,
      space_id: formData.space_id || null,
      group_name: spaceName, // Use space name for backward compatibility
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
            <Label htmlFor="space_id">Space</Label>
            <Select value={formData.space_id} onValueChange={(value) => setFormData({ ...formData, space_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select space" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
