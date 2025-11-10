import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CategoryDialog } from "./CategoryDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const CategoriesSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [activeType, setActiveType] = useState<"income" | "expense">("expense");
  
  const { categories: allCategories, deleteCategory } = useCategories();
  const incomeCategories = allCategories.filter(c => c.type === "income");
  const expenseCategories = allCategories.filter(c => c.type === "expense");

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const renderCategoryList = (categories: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{category.name}</h3>
              <Badge variant={category.type === "income" ? "default" : "destructive"}>
                {category.type}
              </Badge>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {categories.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="py-10 text-center text-muted-foreground">
            No categories found. Create your first category to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categories</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as "income" | "expense")}>
        <TabsList>
          <TabsTrigger value="expense">Expense Categories</TabsTrigger>
          <TabsTrigger value="income">Income Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4">
          {renderCategoryList(expenseCategories)}
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          {renderCategoryList(incomeCategories)}
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        category={editingCategory}
      />
    </div>
  );
};
