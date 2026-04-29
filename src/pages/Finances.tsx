import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { FinanceDashboardView } from "@/components/finances/FinanceDashboardView";
import { CashFlowView } from "@/components/finances/CashFlowView";
import { CreditScoreView } from "@/components/finances/CreditScoreView";
import { BalancesView } from "@/components/finances/BalancesView";

import { LayoutDashboard, TrendingUp, CreditCard, Scale } from "lucide-react";

const Finances = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <FinancialDataProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
          <AppSidebar />
          <SidebarRail />
          
          <SidebarInset>
            <div className="flex h-full flex-col">
              
              <TopBar title="Finance" />

              <div className="flex-1 overflow-auto p-3 md:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
                  <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                    <TabsList className="bg-muted/50 inline-flex h-auto gap-0.5 md:gap-1 p-1 md:p-1.5 rounded-lg md:rounded-xl min-w-max">
                      <TabsTrigger value="dashboard" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <LayoutDashboard className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Dashboard</span>
                      </TabsTrigger>
                      <TabsTrigger value="accounts" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Accounts</span>
                      </TabsTrigger>
                      <TabsTrigger value="cashflow" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Cash Flow</span>
                      </TabsTrigger>
                      <TabsTrigger value="balances" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Scale className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Balances</span>
                      </TabsTrigger>
                      <TabsTrigger value="balance" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <PieChart className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Balance Sheet</span>
                      </TabsTrigger>
                      <TabsTrigger value="credit" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Credit Score</span>
                      </TabsTrigger>
                      <TabsTrigger value="budget" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <PiggyBank className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Budget</span>
                      </TabsTrigger>
                      <TabsTrigger value="trial-balance" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <FileSpreadsheet className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Trial Balance</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="dashboard" className="mt-0">
                    <FinanceDashboardView />
                  </TabsContent>

                  <TabsContent value="accounts" className="mt-0">
                    <AccountBalancesView />
                  </TabsContent>

                  <TabsContent value="cashflow" className="mt-0">
                    <CashFlowView />
                  </TabsContent>

                  <TabsContent value="balances" className="mt-0">
                    <BalancesView />
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

                  <TabsContent value="trial-balance" className="mt-0">
                    <TrialBalanceView />
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
