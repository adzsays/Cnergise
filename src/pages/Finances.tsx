import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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
              <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-between px-6">
                  <div>
                    <h1 className="text-2xl font-bold gradient-heading">Financial Management</h1>
                    <p className="text-sm text-muted-foreground">
                      Cash Flow Projections & Balance Sheet
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </header>

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
