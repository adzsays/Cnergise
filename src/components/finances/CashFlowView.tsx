import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Upload, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Edit2, Trash2, Building2, User } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSpaceFilter } from '@/hooks/useSpaceFilter';
import { TransactionDialog } from './TransactionDialog';
import { TransactionTable } from './TransactionTable';
import { CashFlowChart } from './CashFlowChart';
import { CategoryFilter } from './CategoryFilter';
import { ImportDialog } from './ImportDialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  getDayOfPeriodLabel, 
  getMaxDayOfPeriod, 
  getWeekdayOptions,
  getNextBusinessDay 
} from '@/utils/businessDays';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const CashFlowView = () => {
  const { 
    transactions, 
    accounts,
    loading, 
    monthLabels,
    updateTransaction, 
    updateTransactionName, 
    updateTransactionDate, 
    updateTransactionCategory,
    deleteTransaction,
    addTransaction, 
    viewMode, 
    setViewMode, 
    group, 
    setGroup 
  } = useFinancialData();
  const { spaces, getDefaultSpaceId, currentSpaceId } = useSpaceFilter();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ name: '', amount: '', date: 1, category: '' });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTransactionData, setNewTransactionData] = useState({
    type: 'expense' as 'expense' | 'income',
    category: '',
    subcategory: '',
    amount: '',
    oneTimeDate: new Date().toISOString().split('T')[0],
    dayOfPeriod: new Date().getDate(),
    space_id: getDefaultSpaceId() || '',
    frequency: 'monthly',
    cost_centre: 'General'
  });

  const weekdayOptions = useMemo(() => getWeekdayOptions(), []);

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
      const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;
      const typeMatch = selectedType === 'all' || t.type === selectedType;
      // Filter by current space if one is selected
      const spaceMatch = !currentSpaceId || t.space_id === currentSpaceId;
      return categoryMatch && typeMatch && spaceMatch;
    });
  }, [transactions, selectedCategory, selectedType, currentSpaceId]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

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

  const displayGroups = viewMode === 'costcentre' ? groupedByCategory : groupedByType;
  const categoryKeys = Object.keys(displayGroups);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = () => setExpandedCategories(new Set(categoryKeys));
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

  // Calculate timestamp from day of period or one-time date for new transactions
  const calculateNewTransactionTimestamp = (): number => {
    const freq = newTransactionData.frequency;
    
    if (freq === 'one-time') {
      const date = new Date(newTransactionData.oneTimeDate);
      return getNextBusinessDay(date).getTime();
    }
    
    if (freq === 'daily') {
      return new Date().getTime();
    }
    
    const now = new Date();
    let referenceDate: Date;
    
    if (freq === 'weekly') {
      const currentDay = now.getDay() || 7;
      const targetDay = newTransactionData.dayOfPeriod;
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      referenceDate = new Date(now);
      referenceDate.setDate(now.getDate() + daysUntil);
    } else {
      referenceDate = new Date(now.getFullYear(), now.getMonth(), newTransactionData.dayOfPeriod);
    }
    
    return referenceDate.getTime();
  };

  const handleAddTransaction = async () => {
    if (!newTransactionData.subcategory || !newTransactionData.amount || !newTransactionData.category) return;

    const amount = parseFloat(newTransactionData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const finalAmount = newTransactionData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    const dateTimestamp = calculateNewTransactionTimestamp();

    // Get space name for group_name field (backward compatibility)
    const selectedSpace = spaces.find(s => s.id === newTransactionData.space_id);
    const spaceName = selectedSpace?.name || 'General';

    await addTransaction({
      category: newTransactionData.category,
      subcategory: newTransactionData.subcategory,
      type: newTransactionData.type,
      monthly: finalAmount,
      amount: finalAmount,
      group_name: spaceName,
      space_id: newTransactionData.space_id || null,
      date: dateTimestamp,
      frequency: newTransactionData.frequency,
      cost_centre: newTransactionData.cost_centre,
    });

    setAddDialogOpen(false);
    setNewTransactionData({
      type: 'expense',
      category: '',
      subcategory: '',
      amount: '',
      oneTimeDate: new Date().toISOString().split('T')[0],
      dayOfPeriod: new Date().getDate(),
      space_id: getDefaultSpaceId() || '',
      frequency: 'monthly',
      cost_centre: 'General'
    });
  };

  const initialCashBalance = useMemo(() => {
    return accounts
      .filter(a => a.type === 'Asset')
      .reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

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

  const rollingCashFlow = useMemo(() => {
    return monthlyTotals.reduce((acc, monthTotal, index) => {
      const previousBalance = index === 0 ? initialCashBalance : acc[index - 1];
      acc.push(previousBalance + monthTotal);
      return acc;
    }, [] as number[]);
  }, [monthlyTotals, initialCashBalance]);

  const formatCurrency = (amount: number) => `£${Math.abs(amount).toLocaleString()}`;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-muted/50">
            <span className={`text-[10px] md:text-xs ${viewMode === 'type' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>Type</span>
            <Switch checked={viewMode === 'costcentre'} onCheckedChange={(c) => setViewMode(c ? 'costcentre' : 'type')} className="scale-75 md:scale-90" />
            <span className={`text-[10px] md:text-xs ${viewMode === 'costcentre' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>Category</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="h-8 text-xs md:text-sm">
            <Upload className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="h-8 text-xs md:text-sm">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <CashFlowChart transactions={filteredTransactions} />

      {/* Rolling Cash Flow Summary */}
      <div className="rounded-lg md:rounded-xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between p-3 md:p-4 bg-muted/30">
          <h3 className="text-xs md:text-sm font-semibold">12-Month Projection</h3>
          <Button
            onClick={() => expandedCategories.size === categoryKeys.length ? collapseAll() : expandAll()}
            variant="ghost"
            size="sm"
            className="h-7 md:h-8 text-xs"
          >
            {expandedCategories.size === categoryKeys.length ? (
              <><ChevronsUpDown className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />Collapse</>
            ) : (
              <><ChevronsDownUp className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />Expand</>
            )}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="text-[10px] md:text-xs font-medium py-2 px-2 md:px-3 min-w-[80px]">Balance</TableHead>
                <TableHead className="text-right text-[10px] md:text-xs font-medium py-2 px-2 md:px-3 min-w-[60px]">Monthly</TableHead>
                {monthLabels.map((month) => (
                  <TableHead key={month} className="text-right text-[10px] md:text-xs font-medium py-2 px-1 md:px-3 min-w-[50px]">{month}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-primary/5 font-semibold border-b-2 border-primary/20">
                <TableCell colSpan={2} className="text-[10px] md:text-xs py-2 px-2 md:px-3">Rolling Cash Flow</TableCell>
                {rollingCashFlow.map((balance, idx) => (
                  <TableCell
                    key={idx}
                    className={`text-right text-[10px] md:text-xs py-2 px-1 md:px-3 ${balance >= 0 ? 'text-income' : 'text-expense'}`}
                  >
                    {formatCurrency(balance)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Transactions by Category */}
      <div className="rounded-lg md:rounded-xl border border-border/50 overflow-hidden">
        <ScrollArea className="h-[300px] md:h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="text-[10px] md:text-xs font-medium py-2 px-2 md:px-3 min-w-[100px]">Item</TableHead>
                <TableHead className="text-right text-[10px] md:text-xs font-medium py-2 px-2 md:px-3 min-w-[60px]">Monthly</TableHead>
                {monthLabels.map((month) => (
                  <TableHead key={month} className="text-right text-[10px] md:text-xs font-medium py-2 px-1 md:px-3 min-w-[50px]">{month}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(displayGroups).map(([groupName, groupTransactions]) => {
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
                    <TableRow 
                      className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors" 
                      onClick={() => toggleCategory(groupName)}
                    >
                      <TableCell className="font-medium text-xs py-2 px-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          {groupName}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right text-xs font-medium py-2 px-3 ${groupRecurringTotal >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatCurrency(groupRecurringTotal)}
                      </TableCell>
                      {groupMonthlyTotals.map((total, idx) => (
                        <TableCell key={idx} className={`text-right text-xs font-medium py-2 px-3 ${total >= 0 ? 'text-income' : 'text-expense'}`}>
                          {formatCurrency(total)}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {isExpanded && groupTransactions.map((transaction) => {
                      const isEditing = editingId === transaction.id;
                      const projections = Array.isArray(transaction.projections) ? transaction.projections : Array(12).fill(transaction.monthly);
                      
                      return (
                        <TableRow key={transaction.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="py-2 px-3">
                            {isEditing ? (
                              <div className="space-y-2 py-2">
                                <Input
                                  value={editValue.name}
                                  onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                                  className="h-8 text-xs"
                                  placeholder="Name"
                                />
                                <Input
                                  value={editValue.category}
                                  onChange={(e) => setEditValue({ ...editValue, category: e.target.value })}
                                  className="h-8 text-xs"
                                  placeholder="Category"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="number"
                                    value={editValue.amount}
                                    onChange={(e) => setEditValue({ ...editValue, amount: e.target.value })}
                                    className="h-8 text-xs"
                                    placeholder="Amount"
                                  />
                                  <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={editValue.date}
                                    onChange={(e) => setEditValue({ ...editValue, date: parseInt(e.target.value) || 1 })}
                                    className="h-8 text-xs"
                                    placeholder="Day"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(transaction.id, transaction.type as 'income' | 'expense', transaction.category)} className="flex-1 h-7 text-xs">Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1 h-7 text-xs">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-muted-foreground">{transaction.subcategory}</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(transaction.id, transaction.subcategory, transaction.monthly, transaction.date, transaction.category);
                                }}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100 text-destructive" onClick={(e) => {
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
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-right text-xs py-2 px-3 ${transaction.monthly >= 0 ? 'text-income' : 'text-expense'}`}>
                            {formatCurrency(transaction.monthly)}
                          </TableCell>
                          {projections.map((proj, idx) => {
                            let displayValue = proj;
                            if (idx === 0) {
                              const recurringDay = getRecurringDay(transaction.date);
                              const transactionDate = getTransactionDateInCurrentMonth(recurringDay);
                              if (transactionDate < today) displayValue = 0;
                            }
                            return (
                              <TableCell key={idx} className={`text-right text-xs py-2 px-3 ${displayValue >= 0 ? 'text-income/70' : 'text-expense/70'}`}>
                                {displayValue !== 0 ? formatCurrency(displayValue) : '-'}
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
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Add a new transaction with frequency and cost centre</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newTransactionData.type} onValueChange={(v) => setNewTransactionData({ ...newTransactionData, type: v as 'income' | 'expense' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={newTransactionData.frequency} onValueChange={(v) => setNewTransactionData({ ...newTransactionData, frequency: v })}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Space</Label>
                <Select value={newTransactionData.space_id} onValueChange={(v) => setNewTransactionData({ ...newTransactionData, space_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select space" /></SelectTrigger>
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
                <Label>Cost Centre</Label>
                <Select value={newTransactionData.cost_centre} onValueChange={(v) => setNewTransactionData({ ...newTransactionData, cost_centre: v })}>
                  <SelectTrigger><SelectValue placeholder="Select cost centre" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="IT & Technology">IT & Technology</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Research & Development">Research & Development</SelectItem>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={newTransactionData.category}
                onChange={(e) => setNewTransactionData({ ...newTransactionData, category: e.target.value })}
                placeholder="e.g., Salary, Rent, Utilities"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={newTransactionData.subcategory}
                onChange={(e) => setNewTransactionData({ ...newTransactionData, subcategory: e.target.value })}
                placeholder="e.g., Monthly salary, Electric bill"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (£)</Label>
                <Input
                  type="number"
                  value={newTransactionData.amount}
                  onChange={(e) => setNewTransactionData({ ...newTransactionData, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              {newTransactionData.frequency === 'one-time' ? (
                <div>
                  <Label>Transaction Date</Label>
                  <Input
                    type="date"
                    value={newTransactionData.oneTimeDate}
                    onChange={(e) => setNewTransactionData({ ...newTransactionData, oneTimeDate: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Adjusted to next business day if weekend/holiday
                  </p>
                </div>
              ) : newTransactionData.frequency === 'daily' ? (
                <div>
                  <Label>Schedule</Label>
                  <p className="text-sm text-muted-foreground py-2">
                    Repeats every business day
                  </p>
                </div>
              ) : newTransactionData.frequency === 'weekly' ? (
                <div>
                  <Label>{getDayOfPeriodLabel(newTransactionData.frequency)}</Label>
                  <Select 
                    value={newTransactionData.dayOfPeriod.toString()} 
                    onValueChange={(v) => setNewTransactionData({ ...newTransactionData, dayOfPeriod: parseInt(v) })}
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
                  <Label>{getDayOfPeriodLabel(newTransactionData.frequency)}</Label>
                  <Input
                    type="number"
                    min="1"
                    max={getMaxDayOfPeriod(newTransactionData.frequency)}
                    value={newTransactionData.dayOfPeriod}
                    onChange={(e) => setNewTransactionData({ ...newTransactionData, dayOfPeriod: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {newTransactionData.frequency === 'monthly' && 'e.g., 15 = 15th of each month'}
                    {newTransactionData.frequency === 'quarterly' && 'e.g., 45 = 45th day of quarter'}
                    {newTransactionData.frequency === 'yearly' && 'e.g., 100 = 100th day of year'}
                    {' '}• Adjusted to business day
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTransaction}>Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
