import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { CashFlowView } from "@/components/finances/CashFlowView";
import { BalanceSheetView } from "@/components/finances/BalanceSheetView";
import { AccountBalancesView } from "@/components/finances/AccountBalancesView";
import { Wallet, TrendingUp, PieChart } from "lucide-react";

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
                  <TabsList className="bg-muted/50">
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
