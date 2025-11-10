import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { StatsSidebar } from "@/components/StatsSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsSection } from "@/components/finances/TransactionsSection";
import { BudgetsSection } from "@/components/finances/BudgetsSection";
import { AccountsSection } from "@/components/finances/AccountsSection";
import { CategoriesSection } from "@/components/finances/CategoriesSection";
import { OverviewSection } from "@/components/finances/OverviewSection";

const Finances = () => {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-foreground">Cash Flow Management</h1>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewSection />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsSection />
            </TabsContent>

            <TabsContent value="budgets">
              <BudgetsSection />
            </TabsContent>

            <TabsContent value="accounts">
              <AccountsSection />
            </TabsContent>

            <TabsContent value="categories">
              <CategoriesSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {showStats && <StatsSidebar />}
    </div>
  );
};

export default Finances;
