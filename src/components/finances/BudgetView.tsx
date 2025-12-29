import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
}

const mockBudgets: BudgetCategory[] = [
  { id: '1', name: 'Housing', budgeted: 1500, spent: 1500, icon: '🏠', color: 'bg-blue-500' },
  { id: '2', name: 'Food & Dining', budgeted: 600, spent: 450, icon: '🍕', color: 'bg-orange-500' },
  { id: '3', name: 'Transportation', budgeted: 400, spent: 380, icon: '🚗', color: 'bg-green-500' },
  { id: '4', name: 'Utilities', budgeted: 200, spent: 185, icon: '💡', color: 'bg-yellow-500' },
  { id: '5', name: 'Entertainment', budgeted: 300, spent: 420, icon: '🎬', color: 'bg-purple-500' },
  { id: '6', name: 'Shopping', budgeted: 250, spent: 180, icon: '🛍️', color: 'bg-pink-500' },
  { id: '7', name: 'Health', budgeted: 150, spent: 75, icon: '💊', color: 'bg-red-500' },
  { id: '8', name: 'Savings', budgeted: 500, spent: 500, icon: '💰', color: 'bg-emerald-500' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
};

export const BudgetView = () => {
  const [budgets, setBudgets] = useState<BudgetCategory[]>(mockBudgets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getStatusBadge = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return <Badge variant="destructive">Over Budget</Badge>;
    if (percentage >= 80) return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Near Limit</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-500">On Track</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${remaining >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <TrendingUp className={`h-6 w-6 ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Budget Overview</CardTitle>
              <CardDescription>
                {formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)} spent
              </CardDescription>
            </div>
            <span className="text-2xl font-bold">
              {Math.round((totalSpent / totalBudgeted) * 100)}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(totalSpent / totalBudgeted) * 100} 
            className="h-4"
          />
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Categories</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Budget Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input id="category-name" placeholder="e.g., Groceries" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget-amount">Monthly Budget</Label>
                    <Input id="budget-amount" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-icon">Icon</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">🏠 Housing</SelectItem>
                        <SelectItem value="food">🍕 Food</SelectItem>
                        <SelectItem value="car">🚗 Transport</SelectItem>
                        <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                        <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                        <SelectItem value="health">💊 Health</SelectItem>
                        <SelectItem value="savings">💰 Savings</SelectItem>
                        <SelectItem value="other">📦 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                    Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{budget.icon}</span>
                    <div>
                      <h4 className="font-medium">{budget.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.budgeted)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(budget.spent, budget.budgeted)}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(budget.budgeted - budget.spent)} remaining
                    </span>
                    <span>{Math.round((budget.spent / budget.budgeted) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getProgressColor(budget.spent, budget.budgeted)}`}
                      style={{ width: `${Math.min((budget.spent / budget.budgeted) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
