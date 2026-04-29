import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import {
  Building2,
  CreditCard,
  Landmark,
  Home,
  Car,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { SourceAccount } from '@/contexts/FinancialDataContext';

type AccountType = SourceAccount['type'];

export function BalanceSheetView() {
  const {
    balanceSheet,
    availableGroups,
    updateAccountBalance,
    updateAccountName,
    updateAccountGroup,
    updateAccountCategory,
    updateHomeValue,
    updateCarValue,
    updatePhysicalAssetGroup,
    viewMode,
    setViewMode,
  } = useFinancialData();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState<string>('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [physicalAssetsOpen, setPhysicalAssetsOpen] = useState(false);

  const allAssets = [
    ...balanceSheet.bankAccounts,
    ...balanceSheet.investments,
    ...balanceSheet.pensions,
  ];

  const filteredAssets =
    selectedGroup === 'All' ? allAssets : allAssets.filter((a) => a.group === selectedGroup);

  const assetsByCategory = filteredAssets.reduce((acc, asset) => {
    const category = asset.category || 'Other Assets';
    if (!acc[category]) acc[category] = [];
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, typeof allAssets>);

  const filteredLiabilities =
    selectedGroup === 'All'
      ? balanceSheet.liabilities
      : balanceSheet.liabilities.filter((l) => l.group === selectedGroup);

  const liabilitiesByCategory = filteredLiabilities.reduce((acc, liability) => {
    const category = liability.category || 'Other Liabilities';
    if (!acc[category]) acc[category] = [];
    acc[category].push(liability);
    return acc;
  }, {} as Record<string, typeof filteredLiabilities>);

  const showHome = selectedGroup === 'All' || balanceSheet.homeGroup === selectedGroup;
  const showCar = selectedGroup === 'All' || balanceSheet.carGroup === selectedGroup;

  const assetsTotal = filteredAssets.reduce((sum, a) => sum + a.balance, 0);
  const physicalAssetsTotal =
    (showHome ? balanceSheet.homeValue : 0) + (showCar ? balanceSheet.carValue : 0);
  const liabilitiesTotal = Math.abs(filteredLiabilities.reduce((sum, l) => sum + l.balance, 0));

  const totalAssets = assetsTotal + physicalAssetsTotal;
  const totalLiabilities = liabilitiesTotal;

  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setExpandedCategories(next);
  };

  const startEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(Math.abs(currentValue).toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = (accountId: string, type: AccountType | 'home' | 'car') => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) {
      toast({ title: 'Invalid value', description: 'Enter a valid positive number', variant: 'destructive' });
      return;
    }
    if (type === 'home') updateHomeValue(newValue);
    else if (type === 'car') updateCarValue(newValue);
    else updateAccountBalance(accountId, newValue, type);
    toast({ title: 'Balance updated', description: 'The balance has been successfully updated' });
    cancelEdit();
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    setPhysicalAssetsOpen(false);
  };
  const expandAll = () => {
    const allCategories = [...Object.keys(assetsByCategory), ...Object.keys(liabilitiesByCategory)];
    setExpandedCategories(new Set(allCategories));
    setPhysicalAssetsOpen(true);
  };

  const renderAccountCard = (account: SourceAccount) => {
    const isLiability = account.type === 'liability';
    return (
      <Card
        key={account.id}
        className={`p-3 sm:p-4 border-none shadow-sm hover:shadow-md transition-shadow ${
          isLiability ? 'bg-expense/5' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {editingName === account.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      placeholder="Account name"
                      className="h-8 w-32 sm:w-40 text-xs sm:text-sm font-medium"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (!editNameValue.trim()) {
                          toast({ title: 'Invalid name', variant: 'destructive' });
                          return;
                        }
                        updateAccountName(account.id, editNameValue.trim(), account.type);
                        setEditingName(null);
                      }}
                    >
                      <Check className="h-3 w-3 text-success" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingName(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-sm sm:text-base font-medium">{account.name}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setEditingName(account.id);
                        setEditNameValue(account.name);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {account.creditLimit && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Limit: £{account.creditLimit.toLocaleString()}
                  </p>
                )}
              </div>
              {editingId === account.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 sm:w-32 text-right text-sm"
                  />
                  <Button size="sm" variant="ghost" onClick={() => saveEdit(account.id, account.type)}>
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-4 w-4 text-expense" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-base sm:text-lg font-bold ${isLiability ? 'text-expense' : ''}`}>
                      {account.currency === 'GBP' ? '£' : account.currency === 'INR' ? '₹' : ''}
                      {Math.abs(account.balance).toLocaleString()}
                    </p>
                    {account.creditLimit && (
                      <p className="text-[10px] sm:text-xs text-success">
                        £{(account.creditLimit - Math.abs(account.balance)).toLocaleString()} avail
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(account.id, account.balance)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">{account.currency}</p>
              {editingCategory === account.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editCategoryValue}
                    onChange={(e) => setEditCategoryValue(e.target.value)}
                    placeholder="Category"
                    className="h-6 w-32 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      if (!editCategoryValue.trim()) {
                        toast({ title: 'Invalid category', variant: 'destructive' });
                        return;
                      }
                      updateAccountCategory(account.id, editCategoryValue.trim(), account.type);
                      setEditingCategory(null);
                    }}
                  >
                    <Check className="h-3 w-3 text-success" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingCategory(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground">
                    {account.category || 'Other'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setEditingCategory(account.id);
                      setEditCategoryValue(account.category || '');
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {editingGroup === account.id ? (
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={account.group}
                    onValueChange={(value) => {
                      updateAccountGroup(account.id, value, account.type);
                      setEditingGroup(null);
                    }}
                  >
                    <SelectTrigger className="h-6 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingGroup(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isLiability ? 'bg-expense/20 text-expense' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {account.group}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditingGroup(account.id)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Financial Statement</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Assets &amp; Liabilities Overview</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allCategories = [...Object.keys(assetsByCategory), ...Object.keys(liabilitiesByCategory)];
              const allExpanded = expandedCategories.size === allCategories.length && physicalAssetsOpen;
              if (allExpanded) collapseAll();
              else expandAll();
            }}
            className="h-8 text-xs sm:text-sm"
          >
            {expandedCategories.size > 0 ? (
              <>
                <ChevronsUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronsDownUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">View:</span>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {availableGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm ${viewMode === 'type' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
            >
              By Type
            </span>
            <Switch
              checked={viewMode === 'costcentre'}
              onCheckedChange={(checked) => setViewMode(checked ? 'costcentre' : 'type')}
            />
            <span
              className={`text-xs sm:text-sm ${viewMode === 'costcentre' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
            >
              By Cost Centre
            </span>
          </div>
        </div>
      </div>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-none shadow-lg">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Assets</p>
            <p className="text-sm sm:text-lg font-bold text-success">£{totalAssets.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Liabilities</p>
            <p className="text-sm sm:text-lg font-bold text-expense">£{totalLiabilities.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Net Worth</p>
            <p className="text-sm sm:text-lg font-bold text-primary">
              £{(totalAssets - totalLiabilities).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {Object.entries(assetsByCategory).map(([category, list]) => {
        const categoryTotal = list.reduce((sum, a) => sum + a.balance, 0);
        const isOpen = expandedCategories.has(category);
        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{category}</h2>
                {!isOpen && (
                  <span className="text-sm font-bold text-primary ml-2">£{categoryTotal.toLocaleString()}</span>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">{list.map(renderAccountCard)}</CollapsibleContent>
          </Collapsible>
        );
      })}

      {(showHome || showCar) && (
        <Collapsible open={physicalAssetsOpen} onOpenChange={setPhysicalAssetsOpen}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-success" />
              <h2 className="text-lg font-semibold">Physical Assets</h2>
              {!physicalAssetsOpen && (
                <span className="text-sm font-bold text-success ml-2">£{physicalAssetsTotal.toLocaleString()}</span>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown className={`h-4 w-4 transition-transform ${physicalAssetsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            {showHome && (
              <Card className="p-4 border-none shadow-sm hover:shadow-md transition-shadow bg-success/5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Home
                      </p>
                      {editingId === 'home' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-32 text-right"
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveEdit('home', 'home')}>
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4 text-expense" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-success">£{balanceSheet.homeValue.toLocaleString()}</p>
                          <Button size="sm" variant="ghost" onClick={() => startEdit('home', balanceSheet.homeValue)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingGroup === 'home' ? (
                        <Select
                          defaultValue={balanceSheet.homeGroup}
                          onValueChange={(value) => {
                            updatePhysicalAssetGroup('home', value);
                            setEditingGroup(null);
                          }}
                        >
                          <SelectTrigger className="h-6 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroups.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                            {balanceSheet.homeGroup}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => setEditingGroup('home')}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {showCar && (
              <Card className="p-4 border-none shadow-sm hover:shadow-md transition-shadow bg-success/5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Car
                      </p>
                      {editingId === 'car' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-32 text-right"
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveEdit('car', 'car')}>
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4 text-expense" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-success">£{balanceSheet.carValue.toLocaleString()}</p>
                          <Button size="sm" variant="ghost" onClick={() => startEdit('car', balanceSheet.carValue)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingGroup === 'car' ? (
                        <Select
                          defaultValue={balanceSheet.carGroup}
                          onValueChange={(value) => {
                            updatePhysicalAssetGroup('car', value);
                            setEditingGroup(null);
                          }}
                        >
                          <SelectTrigger className="h-6 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroups.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                            {balanceSheet.carGroup}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => setEditingGroup('car')}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {Object.entries(liabilitiesByCategory).map(([category, list]) => {
        const categoryTotal = Math.abs(list.reduce((sum, l) => sum + l.balance, 0));
        const isOpen = expandedCategories.has(category);
        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-expense" />
                <h2 className="text-lg font-semibold">{category}</h2>
                {!isOpen && (
                  <span className="text-sm font-bold text-expense ml-2">£{categoryTotal.toLocaleString()}</span>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">{list.map(renderAccountCard)}</CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

export default BalanceSheetView;
