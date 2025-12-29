import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { CashFlowView } from "@/components/finances/CashFlowView";
import { BalanceSheetView } from "@/components/finances/BalanceSheetView";

const Finances = () => {
  const [activeTab, setActiveTab] = useState("cashflow");

  return (
    <FinancialDataProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />
          <SidebarRail />
          
          <SidebarInset>
            <div className="flex h-full flex-col">
              <TopBar title="Finance" />

              <div className="flex-1 overflow-auto p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="cashflow">Cash Flow Projections</TabsTrigger>
                    <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cashflow">
                    <CashFlowView />
                  </TabsContent>

                  <TabsContent value="balance">
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
