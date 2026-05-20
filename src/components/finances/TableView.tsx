import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFinancialData, type CashFlowSection } from '@/contexts/FinancialDataContext';
import { Button } from '@/components/ui/button';
import { Building2, User, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Edit2, Plus, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const SECTION_ORDER: CashFlowSection[] = ['operating', 'investing', 'financing'];
const SECTION_LABEL: Record<CashFlowSection, string> = {
  operating: 'Operating Activities',
  investing: 'Investing Activities',
  financing: 'Financing Activities',
};

export function TableView() {
  const { transactions, balanceSheet, monthLabels, updateTransaction, updateTransactionName, updateTransactionDate, updateTransactionGroup, updateTransactionCategory, addTransaction, addGroup, availableGroups, group } = useFinancialData();
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['operating', 'investing', 'financing']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ name: '', amount: '', date: 1, category: '' });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [newTransactionData, setNewTransactionData] = useState({
    type: 'expense' as 'expense' | 'income',
    cash_flow_section: 'operating' as CashFlowSection,
    category: '',
    subcategory: '',
    amount: '',
    date: 1,
    group: 'Personal' as string,
  });
  const [newGroupName, setNewGroupName] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTransactionDateInCurrentMonth = (dayOfMonth: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const getRecurringDay = (timestamp: number) => new Date(timestamp).getDate();

  const filteredTransactions = transactions.filter((t) => {
    if (group === 'all') return true;
    return (t.group || '').toLowerCase() === group.toLowerCase();
  });

  // Group transactions by section, then by category
  const bySection: Record<CashFlowSection, Record<string, typeof transactions>> = {
    operating: {},
    investing: {},
    financing: {},
  };
  filteredTransactions.forEach((t) => {
    const s = (t.cash_flow_section || 'operating') as CashFlowSection;
    if (!bySection[s][t.category]) bySection[s][t.category] = [];
    bySection[s][t.category].push(t);
  });

  const allCategoryKeys = SECTION_ORDER.flatMap((s) =>
    Object.keys(bySection[s]).map((c) => `${s}::${c}`),
  );

  const toggleCategory = (key: string) => {
    const next = new Set(expandedCategories);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedCategories(next);
  };
  const toggleSection = (s: CashFlowSection) => {
    const next = new Set(expandedSections);
    if (next.has(s)) next.delete(s); else next.add(s);
    setExpandedSections(next);
  };
  const expandAll = () => {
    setExpandedSections(new Set(SECTION_ORDER));
    setExpandedCategories(new Set(allCategoryKeys));
  };
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const startEdit = (id: string, name: string, monthly: number, date: number, category: string) => {
    setEditingId(id);
    setEditValue({ name, amount: Math.abs(monthly).toString(), date: getRecurringDay(date), category });
  };

  const saveEdit = async (id: string, type: string, currentCategory: string) => {
    if (!editValue.name.trim() || !editValue.category.trim()) {
      toast({ title: 'Invalid', description: 'Name and cost centre required', variant: 'destructive' });
      return;
    }
    const newMonthly = parseFloat(editValue.amount);
    if (isNaN(newMonthly) || newMonthly < 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    const finalValue = type === 'expense' ? -Math.abs(newMonthly) : Math.abs(newMonthly);
    const categoryChanged = editValue.category.trim() !== currentCategory;
    await Promise.all([
      updateTransactionName(id, editValue.name.trim()),
      updateTransaction(id, finalValue),
      updateTransactionDate(id, new Date(2024, 0, editValue.date).getTime()),
      categoryChanged ? updateTransactionCategory(id, editValue.category.trim()) : Promise.resolve(),
    ]);
    if (!categoryChanged) toast({ title: 'Updated' });
    setEditingId(null);
  };

  const handleAddTransaction = async () => {
    if (!newTransactionData.subcategory || !newTransactionData.amount || !newTransactionData.category) {
      toast({ title: 'Missing info', description: 'Fill name, amount, and cost centre', variant: 'destructive' });
      return;
    }
    const amount = parseFloat(newTransactionData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    const finalAmount = newTransactionData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    await addTransaction({
      category: newTransactionData.category,
      subcategory: newTransactionData.subcategory,
      type: newTransactionData.type,
      monthly: finalAmount,
      amount: finalAmount,
      group: newTransactionData.group,
      cash_flow_section: newTransactionData.cash_flow_section,
      date: new Date(today.getFullYear(), today.getMonth(), newTransactionData.date).getTime(),
    });
    toast({ title: 'Transaction added' });
    setAddDialogOpen(false);
    setNewTransactionData({ type: 'expense', cash_flow_section: 'operating', category: '', subcategory: '', amount: '', date: 1, group: 'Personal' });
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addGroup(newGroupName.trim());
    toast({ title: 'Group added' });
    setAddGroupDialogOpen(false);
    setNewGroupName('');
  };

  // Per-section monthly totals and overall net change
  const sectionTotals: Record<CashFlowSection, number[]> = {
    operating: Array(12).fill(0),
    investing: Array(12).fill(0),
    financing: Array(12).fill(0),
  };
  SECTION_ORDER.forEach((s) => {
    Object.values(bySection[s]).flat().forEach((t) => {
      for (let i = 0; i < 12; i++) {
        if (i === 0) {
          const d = getTransactionDateInCurrentMonth(getRecurringDay(t.date));
          if (d < today) continue;
        }
        sectionTotals[s][i] += t.projections[i] || 0;
      }
    });
  });
  const netChange = monthLabels.map((_, i) =>
    sectionTotals.operating[i] + sectionTotals.investing[i] + sectionTotals.financing[i],
  );

  const initialCashBalance =
    balanceSheet.bankAccounts.reduce((s, a) => s + a.balance, 0) +
    balanceSheet.investments.reduce((s, a) => s + a.balance, 0);

  const rollingCashFlow = netChange.reduce((acc, m, i) => {
    const prev = i === 0 ? initialCashBalance : acc[i - 1];
    acc.push(prev + m);
    return acc;
  }, [] as number[]);

  const getAllCategories = () => Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <TooltipProvider>
      <div className="flex flex-col pb-4">
        <div className="px-1 pt-2 pb-2">
          <h2 className="text-xl font-bold mb-1">12-Month Projections</h2>
          <p className="text-xs text-muted-foreground">Statement of Cash Flows — Operating · Investing · Financing</p>
        </div>

        <Card className="mb-2 p-2">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="text-sm font-semibold">Net Change in Cash &amp; Rolling Balance</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Item
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddGroupDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Group
              </Button>
              <Button
                onClick={() => (expandedCategories.size === allCategoryKeys.length ? collapseAll() : expandAll())}
                variant="outline"
                size="sm"
                className="h-8 gap-2"
              >
                {expandedCategories.size === allCategoryKeys.length ? (
                  <><ChevronsUpDown className="h-3 w-3" />Collapse</>
                ) : (
                  <><ChevronsDownUp className="h-3 w-3" />Expand</>
                )}
              </Button>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs py-1 px-2">Summary</TableHead>
                  <TableHead className="text-right text-xs py-1 px-2">Current</TableHead>
                  {monthLabels.map((m) => (
                    <TableHead key={m} className="text-right text-xs py-1 px-2">{m}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2} className="text-xs py-1 px-2 font-medium">Net Change in Cash</TableCell>
                  {netChange.map((b, i) => (
                    <TableCell key={i} className={`text-right text-xs py-1 px-2 ${b >= 0 ? 'text-income' : 'text-expense'}`}>
                      {b >= 0 ? '' : '-'}£{Math.abs(Math.round(b)).toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={2} className="text-xs py-1 px-2">Rolling Cash Balance</TableCell>
                  {rollingCashFlow.map((b, i) => (
                    <TableCell key={i} className={`text-right text-xs py-1 px-2 ${b >= 0 ? 'text-income' : 'text-expense'}`}>
                      £{Math.abs(Math.round(b)).toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-1 px-2">Item</TableHead>
                    <TableHead className="text-right text-xs py-1 px-2">Monthly</TableHead>
                    {monthLabels.map((m) => (
                      <TableHead key={m} className="text-right text-xs py-1 px-2">{m}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SECTION_ORDER.map((section) => {
                    const sectionOpen = expandedSections.has(section);
                    const cats = Object.entries(bySection[section]);
                    return (
                      <React.Fragment key={section}>
                        <TableRow className="bg-primary/15">
                          <TableCell className="font-bold text-xs py-1 px-2">
                            <button onClick={() => toggleSection(section)} className="flex items-center gap-2 uppercase tracking-wide">
                              {sectionOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {SECTION_LABEL[section]}
                            </button>
                          </TableCell>
                          <TableCell className={`text-right text-xs font-bold py-1 px-2 ${sectionTotals[section].reduce((s,n)=>s+n,0)/12 >= 0 ? 'text-income' : 'text-expense'}`}>
                            £{Math.abs(Math.round(sectionTotals[section].reduce((s,n)=>s+n,0)/12)).toLocaleString()}
                          </TableCell>
                          {sectionTotals[section].map((v, i) => (
                            <TableCell key={i} className={`text-right text-xs font-bold py-1 px-2 ${v >= 0 ? 'text-income' : 'text-expense'}`}>
                              {v >= 0 ? '' : '-'}£{Math.abs(Math.round(v)).toLocaleString()}
                            </TableCell>
                          ))}
                        </TableRow>
                        {sectionOpen && cats.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={14} className="text-xs text-muted-foreground italic py-2 px-6">
                              No items yet — add via Item button and set Section to {SECTION_LABEL[section]}.
                            </TableCell>
                          </TableRow>
                        )}
                        {sectionOpen && cats.map(([catName, catTransactions]) => {
                          const catKey = `${section}::${catName}`;
                          const isExpanded = expandedCategories.has(catKey);
                          const catMonthlyTotals = monthLabels.map((_, mi) =>
                            catTransactions.reduce((sum, t) => {
                              if (mi === 0) {
                                const d = getTransactionDateInCurrentMonth(getRecurringDay(t.date));
                                if (d < today) return sum;
                              }
                              return sum + (t.projections[mi] || 0);
                            }, 0),
                          );
                          const catRecurringTotal = catTransactions.reduce((s, t) => s + t.monthly, 0);
                          return (
                            <React.Fragment key={catKey}>
                              <TableRow className="bg-muted/50">
                                <TableCell className="font-semibold text-xs py-1 px-2 pl-6">
                                  <button onClick={() => toggleCategory(catKey)} className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    {catName}
                                  </button>
                                </TableCell>
                                <TableCell className={`text-right text-xs font-semibold py-1 px-2 ${catRecurringTotal >= 0 ? 'text-income' : 'text-expense'}`}>
                                  £{Math.abs(Math.round(catRecurringTotal)).toLocaleString()}
                                </TableCell>
                                {catMonthlyTotals.map((t, i) => (
                                  <TableCell key={i} className={`text-right text-xs font-semibold py-1 px-2 ${t >= 0 ? 'text-income' : 'text-expense'}`}>
                                    £{Math.abs(Math.round(t)).toLocaleString()}
                                  </TableCell>
                                ))}
                              </TableRow>
                              {isExpanded && catTransactions.map((transaction) => {
                                const isEditing = editingId === transaction.id;
                                return (
                                  <TableRow key={transaction.id}>
                                    <TableCell className="py-1 px-2 pl-10">
                                      {isEditing ? (
                                        <div className="space-y-2 py-2">
                                          <Input value={editValue.name} onChange={(e) => setEditValue({ ...editValue, name: e.target.value })} className="h-8 text-sm" autoFocus placeholder="Name" />
                                          <Input value={editValue.category} onChange={(e) => setEditValue({ ...editValue, category: e.target.value })} className="h-8 text-sm" list="categories-list" placeholder="Cost centre" />
                                          <datalist id="categories-list">
                                            {getAllCategories().map((c) => <option key={c} value={c} />)}
                                          </datalist>
                                          <div className="grid grid-cols-2 gap-2">
                                            <Input type="number" value={editValue.amount} onChange={(e) => setEditValue({ ...editValue, amount: e.target.value })} className="h-8 text-sm" placeholder="Amount" />
                                            <Input type="number" min="1" max="31" value={editValue.date} onChange={(e) => setEditValue({ ...editValue, date: parseInt(e.target.value) || 1 })} className="h-8 text-sm" />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button size="sm" onClick={() => saveEdit(transaction.id, transaction.type, transaction.category)} className="flex-1">
                                              <Save className="h-3 w-3 mr-1" />Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                                              <X className="h-3 w-3 mr-1" />Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs">{transaction.subcategory}</span>
                                          {!transaction.id.startsWith('loan-') && !transaction.id.startsWith('cc-') && (
                                            <Button variant="ghost" size="sm" onClick={() => startEdit(transaction.id, transaction.subcategory, transaction.monthly, transaction.date, transaction.category)} className="h-6 w-6 p-0">
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                          {!transaction.id.startsWith('loan-') && !transaction.id.startsWith('cc-') ? (
                                            <Select value={transaction.group} onValueChange={(v) => updateTransactionGroup(transaction.id, v)}>
                                              <SelectTrigger className="h-6 w-auto border-none bg-transparent gap-1 px-2">
                                                <SelectValue>
                                                  {transaction.group === 'Corential' ? <Building2 className="h-3 w-3 text-corential" /> :
                                                    transaction.group === 'Personal' ? <User className="h-3 w-3 text-personal" /> :
                                                      <span className="text-xs">{transaction.group}</span>}
                                                </SelectValue>
                                              </SelectTrigger>
                                              <SelectContent>
                                                {availableGroups.map((g) => (
                                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <span className="text-[10px] text-muted-foreground italic ml-1">auto</span>
                                          )}
                                          <span className="text-xs text-muted-foreground">Day {getRecurringDay(transaction.date)}</span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className={`text-right text-xs py-1 px-2 ${transaction.monthly > 0 ? 'text-income' : transaction.monthly < 0 ? 'text-expense' : ''}`}>
                                      {transaction.monthly === 0 ? '-' : `£${Math.abs(Math.round(transaction.monthly)).toLocaleString()}`}
                                    </TableCell>
                                    {transaction.projections.map((value, idx) => {
                                      let dv = value;
                                      if (idx === 0) {
                                        const d = getTransactionDateInCurrentMonth(getRecurringDay(transaction.date));
                                        if (d < today) dv = 0;
                                      }
                                      return (
                                        <TableCell key={idx} className={`text-right text-xs py-1 px-2 ${dv > 0 ? 'text-income' : dv < 0 ? 'text-expense' : ''}`}>
                                          {dv === 0 ? '-' : `£${Math.abs(Math.round(dv)).toLocaleString()}`}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </Card>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>Recurring cash flow item</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={newTransactionData.cash_flow_section} onValueChange={(v: CashFlowSection) => setNewTransactionData({ ...newTransactionData, cash_flow_section: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operating">Operating</SelectItem>
                      <SelectItem value="investing">Investing</SelectItem>
                      <SelectItem value="financing">Financing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newTransactionData.type} onValueChange={(v: 'expense' | 'income') => setNewTransactionData({ ...newTransactionData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Outflow (Expense)</SelectItem>
                      <SelectItem value="income">Inflow (Income)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cost Centre / Linked Account</Label>
                <Input list="cc-list" value={newTransactionData.category} onChange={(e) => setNewTransactionData({ ...newTransactionData, category: e.target.value })} placeholder="e.g. Rent, or account name" />
                <datalist id="cc-list">
                  {getAllCategories().map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newTransactionData.subcategory} onChange={(e) => setNewTransactionData({ ...newTransactionData, subcategory: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (£)</Label>
                  <Input type="number" value={newTransactionData.amount} onChange={(e) => setNewTransactionData({ ...newTransactionData, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Input type="number" min="1" max="31" value={newTransactionData.date} onChange={(e) => setNewTransactionData({ ...newTransactionData, date: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={newTransactionData.group} onValueChange={(v) => setNewTransactionData({ ...newTransactionData, group: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTransaction}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addGroupDialogOpen} onOpenChange={setAddGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Group Name</Label>
              <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddGroupDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddGroup}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
