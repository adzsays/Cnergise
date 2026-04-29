import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const fmtGBP = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

const ASSET_CATEGORIES = ['Bank', 'Savings', 'Investment', 'Pension', 'Crypto', 'Cash', 'Other'];
const LIABILITY_CATEGORIES = ['Credit Card', 'Loan', 'Mortgage', 'Overdraft', 'Other'];

export function BalancesView() {
  const { accounts, refreshData } = useFinancialData();
  const [savingId, setSavingId] = useState<string | null>(null);

  const update = async (id: string, patch: Record<string, any>) => {
    setSavingId(id);
    const { error } = await supabase.from('financial_accounts').update(patch).eq('id', id);
    setSavingId(null);
    if (error) {
      toast.error('Save failed');
      console.error(error);
    } else {
      refreshData();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else refreshData();
  };

  const addRow = async (type: 'asset' | 'liability', category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error('Sign in required');
    const { error } = await supabase.from('financial_accounts').insert({
      user_id: user.id,
      name: 'New ' + category,
      type,
      category,
      balance: 0,
      currency: 'GBP',
      group_name: 'Personal',
      credit_limit: category === 'Credit Card' ? 0 : null,
    });
    if (error) toast.error('Add failed');
    else refreshData();
  };

  const { assets, liabilities, creditCards, totals } = useMemo(() => {
    const a = accounts.filter((x) => x.type === 'asset');
    const l = accounts.filter((x) => x.type === 'liability');
    const cc = l.filter((x) => (x.category || '').toLowerCase().includes('credit') || x.credit_limit);
    const tA = a.reduce((s, x) => s + Number(x.balance), 0);
    const tL = l.reduce((s, x) => s + Math.abs(Number(x.balance)), 0);
    return { assets: a, liabilities: l, creditCards: cc, totals: { tA, tL, net: tA - tL } };
  }, [accounts]);

  const Row = ({
    a,
    showLimit,
    categoryOptions,
  }: {
    a: any;
    showLimit?: boolean;
    categoryOptions: string[];
  }) => {
    const used = Math.abs(Number(a.balance));
    const limit = Number(a.credit_limit || 0);
    const utilisation = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    return (
      <tr className={cn('border-b border-border/40 hover:bg-muted/30', savingId === a.id && 'opacity-60')}>
        <td className="py-1 px-2">
          <Input
            defaultValue={a.name}
            onBlur={(e) => e.target.value !== a.name && update(a.id, { name: e.target.value })}
            className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
          />
        </td>
        <td className="py-1 px-2">
          <Select defaultValue={a.category || categoryOptions[0]} onValueChange={(v) => update(a.id, { category: v })}>
            <SelectTrigger className="h-7 border-0 bg-transparent px-1 focus:ring-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="py-1 px-2">
          <Input
            type="number"
            defaultValue={a.balance}
            onBlur={(e) => {
              const v = parseFloat(e.target.value) || 0;
              if (v !== Number(a.balance)) update(a.id, { balance: v });
            }}
            className="h-7 border-0 bg-transparent px-1 text-right tabular-nums focus-visible:ring-1"
          />
        </td>
        {showLimit && (
          <>
            <td className="py-1 px-2">
              <Input
                type="number"
                defaultValue={a.credit_limit ?? ''}
                placeholder="—"
                onBlur={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                  if (v !== a.credit_limit) update(a.id, { credit_limit: v });
                }}
                className="h-7 border-0 bg-transparent px-1 text-right tabular-nums focus-visible:ring-1"
              />
            </td>
            <td className="py-1 px-2 min-w-[140px]">
              {limit > 0 ? (
                <div className="flex items-center gap-2">
                  <Progress
                    value={utilisation}
                    className={cn(
                      'h-1.5 flex-1',
                      utilisation > 80 && '[&>div]:bg-destructive',
                      utilisation > 50 && utilisation <= 80 && '[&>div]:bg-orange-500'
                    )}
                  />
                  <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">
                    {utilisation.toFixed(0)}%
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </td>
          </>
        )}
        <td className="py-1 px-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => remove(a.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Assets</p>
              <p className="text-lg font-semibold text-success tabular-nums">{fmtGBP(totals.tA)}</p>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Liabilities</p>
              <p className="text-lg font-semibold text-destructive tabular-nums">{fmtGBP(totals.tL)}</p>
            </div>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Worth</p>
              <p className={cn('text-lg font-semibold tabular-nums', totals.net >= 0 ? 'text-primary' : 'text-destructive')}>
                {fmtGBP(totals.net)}
              </p>
            </div>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </Card>
      </div>

      {/* Assets */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Assets</h3>
          <Button size="sm" variant="outline" onClick={() => addRow('asset', 'Bank')}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Asset
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                <th className="text-left py-2 px-2 font-medium">Name</th>
                <th className="text-left py-2 px-2 font-medium">Category</th>
                <th className="text-right py-2 px-2 font-medium">Balance</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground">
                    No assets yet.
                  </td>
                </tr>
              ) : (
                assets.map((a) => <Row key={a.id} a={a} categoryOptions={ASSET_CATEGORIES} />)
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Liabilities (incl. credit cards w/ utilisation) */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">Liabilities</h3>
            <p className="text-[10px] text-muted-foreground">Credit cards show utilisation against their limit</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addRow('liability', 'Credit Card')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Credit Card
            </Button>
            <Button size="sm" variant="outline" onClick={() => addRow('liability', 'Loan')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Loan
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                <th className="text-left py-2 px-2 font-medium">Name</th>
                <th className="text-left py-2 px-2 font-medium">Category</th>
                <th className="text-right py-2 px-2 font-medium">Balance</th>
                <th className="text-right py-2 px-2 font-medium">Limit</th>
                <th className="text-left py-2 px-2 font-medium">Utilisation</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted-foreground">
                    No liabilities yet.
                  </td>
                </tr>
              ) : (
                liabilities.map((a) => <Row key={a.id} a={a} showLimit categoryOptions={LIABILITY_CATEGORIES} />)
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
