import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { FinanceDashboardView } from "@/components/finances/FinanceDashboardView";
import { CashFlowView } from "@/components/finances/CashFlowView";
import { CreditScoreView } from "@/components/finances/CreditScoreView";
import { BalancesView } from "@/components/finances/BalancesView";
import { ActualExpensesView } from "@/components/finances/ActualExpensesView";

import { AccountingGroupsView } from "@/components/finances/AccountingGroupsView";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { CustomerManager } from "@/components/invoices/CustomerManager";
import { BillingEntityManager } from "@/components/invoices/BillingEntityManager";
import { ServiceManager } from "@/components/invoices/ServiceManager";

import { LayoutDashboard, TrendingUp, CreditCard, Scale, Receipt, Wallet, Sparkles, FolderTree, FileText, Users, Building2, Briefcase, ListChecks } from "lucide-react";

import { Tabs as InnerTabs, TabsContent as InnerTabsContent, TabsList as InnerTabsList, TabsTrigger as InnerTabsTrigger } from "@/components/ui/tabs";

const InvoicingSection = () => {
  const [tab, setTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const openEditor = (id: string | null) => { setEditingId(id); setTab("editor"); };
  return (
    <InnerTabs value={tab} onValueChange={setTab} className="space-y-4">
      <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-none">
        <InnerTabsList className="inline-flex w-max">
          <InnerTabsTrigger value="list" className="text-xs sm:text-sm"><ListChecks className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Invoices</span></InnerTabsTrigger>
          <InnerTabsTrigger value="editor" className="text-xs sm:text-sm"><FileText className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Editor</span></InnerTabsTrigger>
          <InnerTabsTrigger value="customers" className="text-xs sm:text-sm"><Users className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Customers</span></InnerTabsTrigger>
          <InnerTabsTrigger value="services" className="text-xs sm:text-sm"><Briefcase className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Services</span></InnerTabsTrigger>
          <InnerTabsTrigger value="entities" className="text-xs sm:text-sm"><Building2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Billing</span></InnerTabsTrigger>
        </InnerTabsList>
      </div>
      <InnerTabsContent value="list"><InvoiceList onEdit={(id) => openEditor(id)} onNew={() => openEditor(null)} /></InnerTabsContent>
      <InnerTabsContent value="editor"><InvoiceEditor invoiceId={editingId} onSaved={(id) => setEditingId(id)} /></InnerTabsContent>
      <InnerTabsContent value="customers"><CustomerManager /></InnerTabsContent>
      <InnerTabsContent value="services"><ServiceManager /></InnerTabsContent>
      <InnerTabsContent value="entities"><BillingEntityManager /></InnerTabsContent>
    </InnerTabs>
  );
};

const VIEWS = [
  { value: "cashflow", label: "Forecast", icon: TrendingUp },
  { value: "balances", label: "Inputs & Balances", icon: Scale },
  { value: "expenses", label: "Bank Transactions", icon: Wallet },
  { value: "accounting", label: "Accounting", icon: FolderTree },
  { value: "invoices", label: "Invoices", icon: FileText },
] as const;

const Finances = () => {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  // Legacy ?tab= support — map to ?view=
  const legacy = params.get("tab");
  const initialView = params.get("view") || (legacy && legacy !== "dashboard" ? legacy : "cashflow");
  const [secondaryView, setSecondaryView] = useState<string>(initialView);

  // Reflect choice in URL without reload
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", secondaryView);
    url.searchParams.delete("tab");
    window.history.replaceState({}, "", url.toString());
  }, [secondaryView]);

  return (
    <FinancialDataProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
          <AppSidebar />
          <SidebarRail />
          
          <SidebarInset className="!min-h-0 h-full overflow-hidden">
            <div className="flex h-full flex-col min-h-0">
              
              <TopBar title="Finance" />

              <div className="flex-1 overflow-auto p-3 md:p-6 space-y-4 md:space-y-6">

                {/* Pinned Dashboard — always visible */}
                <FinanceDashboardView />

                {/* Secondary view dropdown */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold">More tools</h2>
                    <p className="text-xs text-muted-foreground">Pick a view to drill in</p>
                  </div>
                  <Select value={secondaryView} onValueChange={setSecondaryView}>
                    <SelectTrigger className="w-[200px] md:w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEWS.map(v => {
                        const Icon = v.icon;
                        return (
                          <SelectItem key={v.value} value={v.value}>
                            <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{v.label}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  {secondaryView === "cashflow" && <CashFlowView />}
                  {secondaryView === "balances" && (
                    <InnerTabs defaultValue="accounts" className="space-y-4">
                      <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-none">
                        <InnerTabsList className="inline-flex w-max">
                          <InnerTabsTrigger value="accounts" className="text-xs sm:text-sm"><Scale className="h-4 w-4 mr-1" />Balances</InnerTabsTrigger>
                          <InnerTabsTrigger value="credit" className="text-xs sm:text-sm"><CreditCard className="h-4 w-4 mr-1" />Credit Score</InnerTabsTrigger>
                        </InnerTabsList>
                      </div>
                      <InnerTabsContent value="accounts"><BalancesView /></InnerTabsContent>
                      <InnerTabsContent value="credit"><CreditScoreView /></InnerTabsContent>
                    </InnerTabs>
                  )}
                  {secondaryView === "expenses" && <ActualExpensesView />}
                  {secondaryView === "accounting" && <AccountingGroupsView />}
                  {secondaryView === "invoices" && <InvoicingSection />}
                </div>

              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </FinancialDataProvider>
  );
};

export default Finances;
