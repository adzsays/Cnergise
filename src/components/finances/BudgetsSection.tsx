import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { BudgetDialog } from "./BudgetDialog";
import { Progress } from "@/components/ui/progress";

export const BudgetsSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const { budgets, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const { transactions } = useTransactions();

  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const category = categories.find((c) => c.id === budget.category_id);
      
      const spent = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          const startDate = new Date(budget.start_date);
          const endDate = new Date(budget.end_date);
          
          return (
            t.category_id === budget.category_id &&
            t.type === "expense" &&
            transactionDate >= startDate &&
            transactionDate <= endDate
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = (spent / Number(budget.amount)) * 100;

      return {
        ...budget,
        categoryName: category?.name || "Unknown",
        spent,
        remaining: Number(budget.amount) - spent,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > Number(budget.amount),
      };
    });
  }, [budgets, categories, transactions]);

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      await deleteBudget.mutateAsync(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Budgets</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetData.map((budget) => (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{budget.categoryName}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {budget.period}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Spent: ${budget.spent.toFixed(2)}</span>
                  <span>Budget: ${Number(budget.amount).toFixed(2)}</span>
                </div>
                <Progress 
                  value={budget.percentage} 
                  className={budget.isOverBudget ? "bg-red-100" : ""}
                />
                <div className="text-sm text-muted-foreground">
                  {budget.isOverBudget ? (
                    <span className="text-red-500 font-semibold">
                      Over budget by ${Math.abs(budget.remaining).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-green-500">
                      ${budget.remaining.toFixed(2)} remaining
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(budget)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(budget.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {budgetData.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              No budgets found. Create your first budget to track spending.
            </CardContent>
          </Card>
        )}
      </div>

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        budget={editingBudget}
      />
    </div>
  );
};
