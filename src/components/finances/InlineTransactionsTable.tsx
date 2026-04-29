import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const COST_CENTRES = ['Personal', 'Home', 'Work', 'Side Hustle', 'Investment', 'Other'];

const toDateInput = (ms: number | null | undefined) => {
  if (!ms) return '';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};
const fromDateInput = (s: string) => (s ? new Date(s).getTime() : null);

export function InlineTransactionsTable() {
  const { transactions, accounts, addTransaction, deleteTransaction } = useFinancialData();
  const [savingId, setSavingId] = useState<string | null>(null);

  const accountNames = useMemo(() => accounts.map((a) => a.name), [accounts]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || '')),
    [transactions]
  );

  const updateField = async (id: string, patch: Partial<{
    subcategory: string; category: string; monthly: number; daily: number; amount: number;
    projections: number[]; date: number; cost_centre: string; frequency: string; end_date: string | null;
  }>) => {
    setSavingId(id);
    const { error } = await supabase.from('financial_transactions').update(patch as any).eq('id', id);
    setSavingId(null);
    if (error) {
      toast.error('Save failed');
      console.error(error);
    }
  };

  const handleAddRow = async () => {
    await addTransaction({
      type: 'expense',
      category: 'Other',
      subcategory: 'New entry',
      monthly: 0,
      cost_centre: 'Personal',
      frequency: 'monthly',
      date: Date.now(),
    });
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Cash Flows</h3>
          <p className="text-xs text-muted-foreground">Edit any cell — changes save automatically</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleAddRow}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <th className="text-left py-2 px-2 font-medium">Description</th>
              <th className="text-right py-2 px-2 font-medium">Amount</th>
              <th className="text-left py-2 px-2 font-medium">Recurring Date</th>
              <th className="text-left py-2 px-2 font-medium">Cost Centre</th>
              <th className="text-left py-2 px-2 font-medium">Frequency</th>
              <th className="text-left py-2 px-2 font-medium">End Date</th>
              <th className="text-left py-2 px-2 font-medium">Account</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-muted-foreground">
                  No transactions yet — click "Add Row" to start.
                </td>
              </tr>
            ) : (
              sorted.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-border/40 hover:bg-muted/30 ${savingId === t.id ? 'opacity-60' : ''}`}
                >
                  <td className="py-1 px-2">
                    <Input
                      defaultValue={t.subcategory || ''}
                      onBlur={(e) =>
                        e.target.value !== t.subcategory && updateField(t.id, { subcategory: e.target.value })
                      }
                      className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      type="number"
                      defaultValue={t.monthly}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        if (v !== t.monthly)
                          updateField(t.id, { monthly: v, daily: v / 30, amount: v, projections: Array(12).fill(v) });
                      }}
                      className="h-7 border-0 bg-transparent px-1 text-right tabular-nums focus-visible:ring-1"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      type="date"
                      defaultValue={toDateInput(t.date)}
                      onBlur={(e) => {
                        const ms = fromDateInput(e.target.value);
                        if (ms && ms !== t.date) updateField(t.id, { date: ms });
                      }}
                      className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Select
                      defaultValue={t.cost_centre || 'Personal'}
                      onValueChange={(v) => updateField(t.id, { cost_centre: v })}
                    >
                      <SelectTrigger className="h-7 border-0 bg-transparent px-1 focus:ring-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COST_CENTRES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-1 px-2">
                    <Select
                      defaultValue={t.frequency || 'monthly'}
                      onValueChange={(v) => updateField(t.id, { frequency: v })}
                    >
                      <SelectTrigger className="h-7 border-0 bg-transparent px-1 focus:ring-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      type="date"
                      defaultValue={(t as any).end_date || ''}
                      onBlur={(e) => updateField(t.id, { end_date: e.target.value || null })}
                      className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Select
                      defaultValue={t.category || ''}
                      onValueChange={(v) => updateField(t.id, { category: v })}
                    >
                      <SelectTrigger className="h-7 border-0 bg-transparent px-1 focus:ring-1">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountNames.length === 0 ? (
                          <SelectItem value="Other">Other</SelectItem>
                        ) : (
                          accountNames.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-1 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteTransaction(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
