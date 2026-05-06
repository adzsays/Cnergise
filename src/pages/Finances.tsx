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
import { ActualExpensesView } from "@/components/finances/ActualExpensesView";
import { CashFlowComparisonView } from "@/components/finances/CashFlowComparisonView";
import { AccountingGroupsView } from "@/components/finances/AccountingGroupsView";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { CustomerManager } from "@/components/invoices/CustomerManager";
import { BillingEntityManager } from "@/components/invoices/BillingEntityManager";
import { ServiceManager } from "@/components/invoices/ServiceManager";

import { LayoutDashboard, TrendingUp, CreditCard, Scale, Receipt, Wallet, Sparkles, FolderTree, FileText, Users, Building2, Briefcase, ListChecks } from "lucide-react";
import { AIBriefCard } from "@/components/ai/AIBriefCard";
import { Tabs as InnerTabs, TabsContent as InnerTabsContent, TabsList as InnerTabsList, TabsTrigger as InnerTabsTrigger } from "@/components/ui/tabs";

const InvoicingSection = () => {
  const [tab, setTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const openEditor = (id: string | null) => { setEditingId(id); setTab("editor"); };
  return (
    <InnerTabs value={tab} onValueChange={setTab} className="space-y-4">
      <InnerTabsList>
        <InnerTabsTrigger value="list"><ListChecks className="h-4 w-4 mr-1" />Invoices</InnerTabsTrigger>
        <InnerTabsTrigger value="editor"><FileText className="h-4 w-4 mr-1" />Editor</InnerTabsTrigger>
        <InnerTabsTrigger value="customers"><Users className="h-4 w-4 mr-1" />Customers</InnerTabsTrigger>
        <InnerTabsTrigger value="services"><Briefcase className="h-4 w-4 mr-1" />Services</InnerTabsTrigger>
        <InnerTabsTrigger value="entities"><Building2 className="h-4 w-4 mr-1" />Billing entities</InnerTabsTrigger>
      </InnerTabsList>
      <InnerTabsContent value="list"><InvoiceList onEdit={(id) => openEditor(id)} onNew={() => openEditor(null)} /></InnerTabsContent>
      <InnerTabsContent value="editor"><InvoiceEditor invoiceId={editingId} onSaved={(id) => setEditingId(id)} /></InnerTabsContent>
      <InnerTabsContent value="customers"><CustomerManager /></InnerTabsContent>
      <InnerTabsContent value="services"><ServiceManager /></InnerTabsContent>
      <InnerTabsContent value="entities"><BillingEntityManager /></InnerTabsContent>
    </InnerTabs>
  );
};

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

              <div className="flex-1 overflow-auto p-3 md:p-6 space-y-4">
                <AIBriefCard scope="finance" title="Finance AI brief" />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
                  <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                    <TabsList className="bg-muted/50 inline-flex h-auto gap-0.5 md:gap-1 p-1 md:p-1.5 rounded-lg md:rounded-xl min-w-max">
                      <TabsTrigger value="dashboard" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <LayoutDashboard className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Dashboard</span>
                      </TabsTrigger>
                      <TabsTrigger value="cashflow" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Cash Flow</span>
                      </TabsTrigger>
                      <TabsTrigger value="balances" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Scale className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Balances</span>
                      </TabsTrigger>
                      <TabsTrigger value="credit" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Credit Score</span>
                      </TabsTrigger>
                      <TabsTrigger value="receipts" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Receipts</span>
                      </TabsTrigger>
                      <TabsTrigger value="expenses" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Expenses</span>
                      </TabsTrigger>
                      <TabsTrigger value="accounting" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <FolderTree className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Accounting</span>
                      </TabsTrigger>
                      <TabsTrigger value="invoices" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Invoices</span>
                      </TabsTrigger>
                      <TabsTrigger value="compare" className="text-xs md:text-sm rounded-md md:rounded-lg px-2 md:px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">AI Compare</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="dashboard" className="mt-0"><FinanceDashboardView /></TabsContent>
                  <TabsContent value="cashflow" className="mt-0"><CashFlowView /></TabsContent>
                  <TabsContent value="balances" className="mt-0"><BalancesView /></TabsContent>
                  <TabsContent value="credit" className="mt-0"><CreditScoreView /></TabsContent>
                  <TabsContent value="receipts" className="mt-0"><ReceiptsView /></TabsContent>
                  <TabsContent value="expenses" className="mt-0"><ActualExpensesView /></TabsContent>
                  <TabsContent value="accounting" className="mt-0"><AccountingGroupsView /></TabsContent>
                  <TabsContent value="invoices" className="mt-0"><InvoicingSection /></TabsContent>
                  <TabsContent value="compare" className="mt-0"><CashFlowComparisonView /></TabsContent>
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
