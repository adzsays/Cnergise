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

import { LayoutDashboard, TrendingUp, CreditCard, Scale, Receipt, Wallet, Sparkles, FolderTree, FileText, Users, Building2, Briefcase, ListChecks, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const initialView = params.get("view") || legacy || "dashboard";
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

              <div className="flex-1 overflow-hidden flex min-h-0">
                {/* Finance sub-nav rail */}
                <aside className="hidden md:flex flex-col w-48 lg:w-56 shrink-0 border-r bg-muted/30 overflow-y-auto p-3 gap-1">
                  <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Finance</div>
                  <button
                    onClick={() => setSecondaryView("dashboard")}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-left transition-colors ${secondaryView === "dashboard" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                  >
                    <LayoutDashboard className="h-4 w-4" />Dashboard
                  </button>
                  {VIEWS.map(v => {
                    const Icon = v.icon;
                    const active = secondaryView === v.value;
                    return (
                      <button
                        key={v.value}
                        onClick={() => setSecondaryView(v.value)}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-left transition-colors ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                      >
                        <Icon className="h-4 w-4" />{v.label}
                      </button>
                    );
                  })}
                </aside>

                <div className="flex-1 overflow-auto p-3 md:p-6 space-y-4 md:space-y-6 min-w-0">
                  {/* Mobile sub-nav: horizontal scroll chips */}
                  <div className="md:hidden -mx-3 px-3 overflow-x-auto scrollbar-none">
                    <div className="inline-flex gap-1.5 pb-1">
                      <button
                        onClick={() => setSecondaryView("dashboard")}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap border ${secondaryView === "dashboard" ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" />Dashboard
                      </button>
                      {VIEWS.map(v => {
                        const Icon = v.icon;
                        const active = secondaryView === v.value;
                        return (
                          <button
                            key={v.value}
                            onClick={() => setSecondaryView(v.value)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                          >
                            <Icon className="h-3.5 w-3.5" />{v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {secondaryView === "dashboard" && <FinanceDashboardView />}
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
