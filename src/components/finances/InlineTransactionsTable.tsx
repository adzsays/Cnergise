import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Settings2, ArrowDownCircle, ArrowUpCircle, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const DEFAULT_COST_CENTRES = ['Personal', 'Home', 'Work', 'Side Hustle', 'Investment', 'Other'];
const COST_CENTRE_KEY = 'finance.costCentres.v1';

const loadCostCentres = (): string[] => {
  try {
    const raw = localStorage.getItem(COST_CENTRE_KEY);
    if (!raw) return DEFAULT_COST_CENTRES;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_COST_CENTRES;
  } catch {
    return DEFAULT_COST_CENTRES;
  }
};
const saveCostCentres = (list: string[]) => {
  localStorage.setItem(COST_CENTRE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('cost-centres-changed'));
};

const toDateInput = (ms: number | null | undefined) => {
  if (!ms) return '';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};
const fromDateInput = (s: string) => (s ? new Date(s).getTime() : null);

export function InlineTransactionsTable() {
  const { transactions, accounts, addTransaction, deleteTransaction, refreshData } = useFinancialData() as any;
  const [savingId, setSavingId] = useState<string | null>(null);
  const [costCentres, setCostCentres] = useState<string[]>(loadCostCentres());
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    const handler = () => setCostCentres(loadCostCentres());
    window.addEventListener('cost-centres-changed', handler);
    return () => window.removeEventListener('cost-centres-changed', handler);
  }, []);

  // Merge stored centres with any centres present in the data so nothing is shown as "legacy".
  // Persist newly discovered centres so they appear in the manager too.
  const allCostCentres = useMemo(() => {
    const seen = new Map<string, string>(); // lowercase -> canonical display
    costCentres.forEach((c) => seen.set(c.toLowerCase(), c));
    transactions.forEach((t: any) => {
      const c = (t.cost_centre || '').trim();
      if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
    });
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [costCentres, transactions]);

  // Auto-persist any newly discovered centres into the managed list
  useEffect(() => {
    const known = new Set(costCentres.map((c) => c.toLowerCase()));
    const missing = allCostCentres.filter((c) => !known.has(c.toLowerCase()));
    if (missing.length > 0) {
      saveCostCentres(allCostCentres);
      setCostCentres(allCostCentres);
    }
  }, [allCostCentres]); // eslint-disable-line react-hooks/exhaustive-deps

  const accountNames = useMemo(() => accounts.map((a) => a.name), [accounts]);

  type SortKey = 'type' | 'subcategory' | 'monthly' | 'date' | 'cost_centre' | 'frequency' | 'end_date' | 'category';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...transactions];
    if (!sortKey) {
      return arr.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
        return (a.subcategory || '').localeCompare(b.subcategory || '');
      });
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // numeric
      if (sortKey === 'monthly' || sortKey === 'date') {
        return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
      }
      // dates as strings (end_date) or generic strings
      const as = (av ?? '').toString().toLowerCase();
      const bs = (bv ?? '').toString().toLowerCase();
      if (as < bs) return -1 * dir;
      if (as > bs) return 1 * dir;
      return 0;
    });
  }, [transactions, sortKey, sortDir]);

  const SortHeader = ({ k, label, align = 'left', className = '' }: { k: SortKey; label: string; align?: 'left' | 'right'; className?: string }) => {
    const active = sortKey === k;
    const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th className={cn(`text-${align} py-2 px-2 font-medium`, className)}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={cn(
            'inline-flex items-center gap-1 hover:text-foreground transition-colors',
            align === 'right' && 'flex-row-reverse',
            active && 'text-foreground'
          )}
        >
          {label}
          <Icon className="h-3 w-3 opacity-60" />
        </button>
      </th>
    );
  };

  const updateField = async (id: string, patch: Partial<{
    subcategory: string; category: string; monthly: number; daily: number; amount: number;
    projections: number[]; date: number; cost_centre: string; frequency: string; end_date: string | null;
    type: 'income' | 'expense';
  }>) => {
    setSavingId(id);
    // Synthetic loan-projection rows (id="loan-projection-<accountId>") aren't real
    // financial_transactions — they're derived from financial_accounts. Persist
    // edits (currently just cost_centre / subcategory) onto the underlying account.
    if (id.startsWith('loan-projection-')) {
      const accountId = id.replace('loan-projection-', '');
      const accountPatch: Record<string, any> = {};
      if (patch.cost_centre !== undefined) accountPatch.cost_centre = patch.cost_centre;
      if (patch.subcategory !== undefined) accountPatch.name = patch.subcategory;
      if (Object.keys(accountPatch).length === 0) {
        setSavingId(null);
        toast.error("This row is auto-generated from a loan — only Cost Centre / Name can be edited here.");
        return;
      }
      const { error } = await supabase.from('financial_accounts').update(accountPatch as any).eq('id', accountId);
      setSavingId(null);
      if (error) {
        toast.error('Save failed');
        console.error(error);
      }
      return;
    }
    const { error } = await supabase.from('financial_transactions').update(patch as any).eq('id', id);
    setSavingId(null);
    if (error) {
      toast.error('Save failed');
      console.error(error);
    }
  };

  // Rename a cost centre across ALL transactions that currently use it
  const renameCostCentreInDb = async (oldName: string, newName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('financial_transactions')
      .update({ cost_centre: newName })
      .eq('user_id', user.id)
      .eq('cost_centre', oldName);
    if (error) {
      toast.error(`Failed to rename "${oldName}"`);
      console.error(error);
    }
  };

  const handleAddRow = async (type: 'income' | 'expense') => {
    await addTransaction({
      type,
      category: 'Other',
      subcategory: type === 'income' ? 'New income' : 'New expense',
      monthly: 0,
      cost_centre: allCostCentres[0] || 'Personal',
      frequency: 'monthly',
      date: Date.now(),
    });
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Cash Flows</h3>
          <p className="text-xs text-muted-foreground">Edit any cell — changes save automatically</p>
        </div>
        <div className="flex gap-2">
          <ManageCostCentresDialog
            open={manageOpen}
            onOpenChange={setManageOpen}
            list={allCostCentres}
            onSave={async (next, renames) => {
              // Apply renames to the DB first, then persist the new list
              for (const { from, to } of renames) {
                if (from !== to) await renameCostCentreInDb(from, to);
              }
              saveCostCentres(next);
              setCostCentres(next);
              if (renames.some((r) => r.from !== r.to)) {
                refreshData?.();
              }
            }}
          />
          <Button size="sm" variant="outline" onClick={() => handleAddRow('income')} className="text-success">
            <ArrowDownCircle className="h-3.5 w-3.5 mr-1" /> Add Income
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAddRow('expense')} className="text-destructive">
            <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <SortHeader k="type" label="Type" className="w-24" />
              <SortHeader k="subcategory" label="Description" />
              <SortHeader k="monthly" label="Amount" align="right" />
              <SortHeader k="date" label="Recurring Date" />
              <SortHeader k="cost_centre" label="Cost Centre" />
              <SortHeader k="frequency" label="Frequency" />
              <SortHeader k="end_date" label="End Date" />
              <SortHeader k="category" label="Account" />
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-muted-foreground">
                  No transactions yet — click "Add Income" or "Add Expense" to start.
                </td>
              </tr>
            ) : (
              sorted.map((t) => (
                <tr
                  key={t.id}
                  className={cn(
                    'border-b border-border/40 hover:bg-muted/30',
                    savingId === t.id && 'opacity-60'
                  )}
                >
                  <td className="py-1 px-2">
                    <Select
                      defaultValue={t.type || 'expense'}
                      onValueChange={(v) => updateField(t.id, { type: v as 'income' | 'expense' })}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-7 border-0 bg-transparent px-1 focus:ring-1 font-medium',
                          t.type === 'income' ? 'text-success' : 'text-destructive'
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">
                          <span className="text-success">Income</span>
                        </SelectItem>
                        <SelectItem value="expense">
                          <span className="text-destructive">Expense</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
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
                    <CostCentreCell
                      transactionId={t.id}
                      value={t.cost_centre}
                      costCentres={allCostCentres}
                      onChange={(v) => updateField(t.id, { cost_centre: v })}
                      onManage={() => setManageOpen(true)}
                    />
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

function CostCentreCell({
  transactionId,
  value,
  costCentres,
  onChange,
  onManage,
}: {
  transactionId: string;
  value: string | null | undefined;
  costCentres: string[];
  onChange: (v: string) => void;
  onManage: () => void;
}) {
  const [local, setLocal] = useState<string>(value || costCentres[0] || 'Personal');

  // Sync from upstream when prop changes (e.g. realtime update from DB)
  useEffect(() => {
    if (value && value !== local) setLocal(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure the current value is always selectable, even if not yet in the managed list
  const optionList = local && !costCentres.includes(local) ? [local, ...costCentres] : costCentres;

  return (
    <Select
      value={local}
      onValueChange={(v) => {
        if (v === '__manage__') {
          onManage();
          return;
        }
        setLocal(v); // optimistic
        onChange(v);
      }}
    >
      <SelectTrigger className="h-7 border-0 bg-transparent px-1 focus:ring-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {optionList.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value="__manage__" className="text-primary">
          <span className="flex items-center gap-1.5">
            <Settings2 className="h-3 w-3" /> Manage cost centres…
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function ManageCostCentresDialog({
  open,
  onOpenChange,
  list,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  list: string[];
  onSave: (next: string[], renames: { from: string; to: string }[]) => void;
}) {
  // Each row tracks its original name so renames can be detected and propagated
  const [draft, setDraft] = useState<{ original: string; current: string }[]>(
    list.map((c) => ({ original: c, current: c }))
  );
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (open) setDraft(list.map((c) => ({ original: c, current: c })));
  }, [open, list]);

  const add = () => {
    const v = newItem.trim();
    if (!v) return;
    if (draft.some((d) => d.current.toLowerCase() === v.toLowerCase())) {
      toast.error('Already exists');
      return;
    }
    setDraft([...draft, { original: '', current: v }]);
    setNewItem('');
  };

  const rename = (i: number, v: string) => {
    const next = [...draft];
    next[i] = { ...next[i], current: v };
    setDraft(next);
  };

  const remove = (i: number) => {
    if (draft.length <= 1) {
      toast.error('Keep at least one cost centre');
      return;
    }
    setDraft(draft.filter((_, idx) => idx !== i));
  };

  const save = () => {
    const cleaned = draft
      .map((d) => ({ original: d.original, current: d.current.trim() }))
      .filter((d) => d.current);
    if (!cleaned.length) {
      toast.error('Add at least one cost centre');
      return;
    }
    const renames = cleaned
      .filter((d) => d.original && d.original !== d.current)
      .map((d) => ({ from: d.original, to: d.current }));
    onSave(cleaned.map((d) => d.current), renames);
    if (renames.length > 0) {
      toast.success(`Renamed ${renames.length} cost centre${renames.length > 1 ? 's' : ''}`);
    } else {
      toast.success('Cost centres updated');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Settings2 className="h-3.5 w-3.5 mr-1" /> Cost Centres
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Cost Centres</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          {draft.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={c.current} onChange={(e) => rename(i, e.target.value)} className="h-8" />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Add new cost centre…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            className="h-8"
          />
          <Button size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
