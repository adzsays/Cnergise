import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { CashFlowView } from "@/components/finances/CashFlowView";
import { BalanceSheetView } from "@/components/finances/BalanceSheetView";
import { AccountBalancesView } from "@/components/finances/AccountBalancesView";
import { CreditScoreView } from "@/components/finances/CreditScoreView";
import { BudgetView } from "@/components/finances/BudgetView";

import { Wallet, TrendingUp, PieChart, CreditCard, PiggyBank } from "lucide-react";

const Finances = () => {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <FinancialDataProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />
          <SidebarRail />
          
          <SidebarInset>
            <div className="flex h-full flex-col">
              
              <TopBar title="Finance" />

              <div className="flex-1 overflow-auto p-4 md:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="accounts" className="text-sm">
                      <Wallet className="h-4 w-4 mr-2" />
                      Accounts
                    </TabsTrigger>
                    <TabsTrigger value="cashflow" className="text-sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Cash Flow
                    </TabsTrigger>
                    <TabsTrigger value="balance" className="text-sm">
                      <PieChart className="h-4 w-4 mr-2" />
                      Balance Sheet
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="text-sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit Score
                    </TabsTrigger>
                    <TabsTrigger value="budget" className="text-sm">
                      <PiggyBank className="h-4 w-4 mr-2" />
                      Budget
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="accounts" className="mt-0">
                    <AccountBalancesView />
                  </TabsContent>

                  <TabsContent value="cashflow" className="mt-0">
                    <CashFlowView />
                  </TabsContent>

                  <TabsContent value="balance" className="mt-0">
                    <BalanceSheetView />
                  </TabsContent>

                  <TabsContent value="credit" className="mt-0">
                    <CreditScoreView />
                  </TabsContent>

                  <TabsContent value="budget" className="mt-0">
                    <BudgetView />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </FinancialDataProvider>
  );
};

export default Finances;
