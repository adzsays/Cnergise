import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { Building2, User, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Edit2, Plus, Save, X, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SkeletonCard } from '@/components/ui/DashboardWidget';

export const ProjectionTableView = () => {
  const { 
    transactions, 
    accounts,
    monthLabels, 
    updateTransaction, 
    updateTransactionName, 
    updateTransactionDate, 
    updateTransactionGroup, 
    updateTransactionCategory,
    deleteTransaction,
    updateCategory, 
    addTransaction, 
    addGroup, 
    availableGroups, 
    viewMode, 
    setViewMode, 
    group, 
    setGroup,
    loading 
  } = useFinancialData();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ name: '', amount: '', date: 1, category: '' });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTransactionData, setNewTransactionData] = useState({
    type: 'expense' as 'expense' | 'income',
    category: '',
    subcategory: '',
    amount: '',
    date: 1,
    group_name: 'Personal'
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const getRecurringDay = (timestamp: number) => new Date(timestamp).getDate();

  const getTransactionDateInCurrentMonth = (dayOfMonth: number) => {
    const date = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (group === 'all') return true;
      return t.group_name.toLowerCase() === group.toLowerCase();
    });
  }, [transactions, group]);

  const groupedByCategory = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = [];
      }
      acc[transaction.category].push(transaction);
      return acc;
    }, {} as Record<string, typeof transactions>);
  }, [filteredTransactions]);

  const groupedByType = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      const type = transaction.type === 'income' ? 'Income' : 'Expenses';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(transaction);
      return acc;
    }, {} as Record<string, typeof transactions>);
  }, [filteredTransactions]);

  const categories = Object.keys(viewMode === 'costcentre' ? groupedByCategory : groupedByType);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = () => setExpandedCategories(new Set(categories));
  const collapseAll = () => setExpandedCategories(new Set());

  const startEdit = (transactionId: string, currentName: string, currentMonthly: number, currentDate: number, currentCategory: string) => {
    setEditingId(transactionId);
    setEditValue({ 
      name: currentName, 
      amount: Math.abs(currentMonthly).toString(),
      date: getRecurringDay(currentDate),
      category: currentCategory
    });
  };

  const saveEdit = async (transactionId: string, transactionType: 'income' | 'expense', currentCategory: string) => {
    if (!editValue.name.trim() || !editValue.category.trim()) return;

    const newMonthly = parseFloat(editValue.amount);
    if (isNaN(newMonthly) || newMonthly < 0) return;

    const finalValue = transactionType === 'expense' ? -Math.abs(newMonthly) : Math.abs(newMonthly);
    
    await Promise.all([
      updateTransactionName(transactionId, editValue.name.trim()),
      updateTransaction(transactionId, finalValue),
      updateTransactionDate(transactionId, new Date(2024, 0, editValue.date).getTime()),
      editValue.category.trim() !== currentCategory && updateTransactionCategory(transactionId, editValue.category.trim())
    ]);
    
    setEditingId(null);
    setEditValue({ name: '', amount: '', date: 1, category: '' });
  };

  const handleGroupChange = (transactionId: string, newGroup: string) => {
    updateTransactionGroup(transactionId, newGroup);
  };

  const handleAddTransaction = async () => {
    if (!newTransactionData.subcategory || !newTransactionData.amount || !newTransactionData.category) return;

    const amount = parseFloat(newTransactionData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const finalAmount = newTransactionData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    await addTransaction({
      category: newTransactionData.category,
      subcategory: newTransactionData.subcategory,
      type: newTransactionData.type,
      monthly: finalAmount,
      amount: finalAmount,
      group_name: newTransactionData.group_name,
    });

    setAddDialogOpen(false);
    setNewTransactionData({
      type: 'expense',
      category: '',
      subcategory: '',
      amount: '',
      date: 1,
      group_name: 'Personal'
    });
  };

  // Calculate initial cash balance from accounts
  const initialCashBalance = useMemo(() => {
    return accounts
      .filter(a => a.type === 'Asset')
      .reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    return monthLabels.map((_, monthIndex) => {
      return filteredTransactions.reduce((sum, t) => {
        if (monthIndex === 0) {
          const recurringDay = getRecurringDay(t.date);
          const transactionDate = getTransactionDateInCurrentMonth(recurringDay);
          if (transactionDate < today) return sum;
        }
        const projection = Array.isArray(t.projections) ? t.projections[monthIndex] : t.monthly;
        return sum + (projection || 0);
      }, 0);
    });
  }, [filteredTransactions, monthLabels, today]);

  // Calculate rolling cash flow
  const rollingCashFlow = useMemo(() => {
    return monthlyTotals.reduce((acc, monthTotal, index) => {
      const previousBalance = index === 0 ? initialCashBalance : acc[index - 1];
      acc.push(previousBalance + monthTotal);
      return acc;
    }, [] as number[]);
  }, [monthlyTotals, initialCashBalance]);

  const formatCurrency = (amount: number) => `£${Math.abs(amount).toLocaleString()}`;

  if (loading) {
    return <SkeletonCard lines={10} />;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">12-Month Projections</h2>
          <p className="text-sm text-muted-foreground">Rolling forecast with monthly recurring amounts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={group} onValueChange={(v) => setGroup(v as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${viewMode === 'type' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>By Type</span>
            <Switch checked={viewMode === 'costcentre'} onCheckedChange={(c) => setViewMode(c ? 'costcentre' : 'type')} />
            <span className={`text-xs ${viewMode === 'costcentre' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>By Category</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Rolling Cash Flow Summary */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Rolling Cash Flow</h3>
          <Button
            onClick={() => expandedCategories.size === categories.length ? collapseAll() : expandAll()}
            variant="outline"
            size="sm"
          >
            {expandedCategories.size === categories.length ? (
              <><ChevronsUpDown className="h-3 w-3 mr-1" />Collapse</>
            ) : (
              <><ChevronsDownUp className="h-3 w-3 mr-1" />Expand</>
            )}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs py-1 px-2">Balance</TableHead>
                <TableHead className="text-right text-xs py-1 px-2">Current</TableHead>
                {monthLabels.map((month) => (
                  <TableHead key={month} className="text-right text-xs py-1 px-2">{month}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-primary/10 font-bold">
                <TableCell colSpan={2} className="text-xs py-1 px-2">Cash Flow</TableCell>
                {rollingCashFlow.map((balance, idx) => (
                  <TableCell
                    key={idx}
                    className={`text-right text-xs py-1 px-2 ${balance >= 0 ? 'text-income' : 'text-expense'}`}
                  >
                    {formatCurrency(balance)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs py-1 px-2">Item</TableHead>
                <TableHead className="text-right text-xs py-1 px-2">Monthly</TableHead>
                {monthLabels.map((month) => (
                  <TableHead key={month} className="text-right text-xs py-1 px-2">{month}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(viewMode === 'costcentre' ? groupedByCategory : groupedByType).map(([groupName, groupTransactions]) => {
                const isExpanded = expandedCategories.has(groupName);
                
                const groupMonthlyTotals = monthLabels.map((_, monthIndex) => {
                  return groupTransactions.reduce((sum, t) => {
                    if (monthIndex === 0) {
                      const recurringDay = getRecurringDay(t.date);
                      const transactionDate = getTransactionDateInCurrentMonth(recurringDay);
                      if (transactionDate < today) return sum;
                    }
                    const projection = Array.isArray(t.projections) ? t.projections[monthIndex] : t.monthly;
                    return sum + (projection || 0);
                  }, 0);
                });

                const groupRecurringTotal = groupTransactions.reduce((sum, t) => sum + t.monthly, 0);
                
                return (
                  <React.Fragment key={groupName}>
                    {/* Group Header */}
                    <TableRow className="bg-muted/50 hover:bg-muted/70 cursor-pointer" onClick={() => toggleCategory(groupName)}>
                      <TableCell className="font-semibold text-xs py-1 px-2">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {groupName}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right text-xs font-semibold py-1 px-2 ${groupRecurringTotal >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatCurrency(groupRecurringTotal)}
                      </TableCell>
                      {groupMonthlyTotals.map((total, idx) => (
                        <TableCell key={idx} className={`text-right text-xs font-semibold py-1 px-2 ${total >= 0 ? 'text-income' : 'text-expense'}`}>
                          {formatCurrency(total)}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Items */}
                    {isExpanded && groupTransactions.map((transaction) => {
                      const isEditing = editingId === transaction.id;
                      const projections = Array.isArray(transaction.projections) ? transaction.projections : Array(12).fill(transaction.monthly);
                      
                      return (
                        <TableRow key={transaction.id} className="hover:bg-muted/20">
                          <TableCell className="py-1 px-2">
                            {isEditing ? (
                              <div className="space-y-2 py-2">
                                <Input
                                  value={editValue.name}
                                  onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="Name"
                                />
                                <Input
                                  value={editValue.category}
                                  onChange={(e) => setEditValue({ ...editValue, category: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="Category"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="number"
                                    value={editValue.amount}
                                    onChange={(e) => setEditValue({ ...editValue, amount: e.target.value })}
                                    className="h-8 text-sm"
                                    placeholder="Amount"
                                  />
                                  <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={editValue.date}
                                    onChange={(e) => setEditValue({ ...editValue, date: parseInt(e.target.value) || 1 })}
                                    className="h-8 text-sm"
                                    placeholder="Day"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(transaction.id, transaction.type as 'income' | 'expense', transaction.category)} className="flex-1">Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">{transaction.subcategory}</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(transaction.id, transaction.subcategory, transaction.monthly, transaction.date, transaction.category);
                                }}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTransaction(transaction.id);
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                {transaction.group_name === 'Business' ? (
                                  <Building2 className="h-3 w-3 text-primary" />
                                ) : (
                                  <User className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="text-xs text-muted-foreground">Day {getRecurringDay(transaction.date)}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-right text-xs py-1 px-2 ${transaction.monthly > 0 ? 'text-income' : transaction.monthly < 0 ? 'text-expense' : ''}`}>
                            {transaction.monthly === 0 ? '-' : formatCurrency(transaction.monthly)}
                          </TableCell>
                          {projections.map((value: number, idx: number) => {
                            let displayValue = value;
                            if (idx === 0) {
                              const recurringDay = getRecurringDay(transaction.date);
                              const transactionDate = getTransactionDateInCurrentMonth(recurringDay);
                              if (transactionDate < today) displayValue = 0;
                            }
                            
                            return (
                              <TableCell key={idx} className={`text-right text-xs py-1 px-2 ${displayValue > 0 ? 'text-income' : displayValue < 0 ? 'text-expense' : ''}`}>
                                {displayValue === 0 ? '-' : formatCurrency(displayValue)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Add a new recurring income or expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newTransactionData.type} onValueChange={(v: 'expense' | 'income') => setNewTransactionData({ ...newTransactionData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={newTransactionData.category}
                onChange={(e) => setNewTransactionData({ ...newTransactionData, category: e.target.value })}
                placeholder="e.g., Housing, Transport, Salary"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newTransactionData.subcategory}
                onChange={(e) => setNewTransactionData({ ...newTransactionData, subcategory: e.target.value })}
                placeholder="e.g., Rent, Car Insurance, Main Job"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Amount (£)</Label>
                <Input
                  type="number"
                  value={newTransactionData.amount}
                  onChange={(e) => setNewTransactionData({ ...newTransactionData, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={newTransactionData.date}
                  onChange={(e) => setNewTransactionData({ ...newTransactionData, date: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={newTransactionData.group_name} onValueChange={(v) => setNewTransactionData({ ...newTransactionData, group_name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableGroups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTransaction}>Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
