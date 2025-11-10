import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewSection } from "@/components/finances/OverviewSection";
import { TransactionsSection } from "@/components/finances/TransactionsSection";
import { BudgetsSection } from "@/components/finances/BudgetsSection";
import { AccountsSection } from "@/components/finances/AccountsSection";
import { CategoriesSection } from "@/components/finances/CategoriesSection";

const Finances = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <div>
                  <h1 className="text-2xl font-bold gradient-heading">Cash Flow Management</h1>
                  <p className="text-sm text-muted-foreground">
                    Track your income, expenses, and manage your budgets
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
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
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Finances;
