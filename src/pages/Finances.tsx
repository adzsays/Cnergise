import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { FinanceDashboardView } from "@/components/finances/FinanceDashboardView";
import { ActualExpensesView } from "@/components/finances/ActualExpensesView";
import { CashFlowView } from "@/components/finances/CashFlowView";
import { AccountingGroupsView } from "@/components/finances/AccountingGroupsView";
import { TrialBalanceView } from "@/components/finances/TrialBalanceView";
import { BalanceSheetView } from "@/components/finances/BalanceSheetView";
import { BudgetView } from "@/components/finances/BudgetView";
import { BalancesView } from "@/components/finances/BalancesView";
import { CreditScoreView } from "@/components/finances/CreditScoreView";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { CustomerManager } from "@/components/invoices/CustomerManager";
import { BillingEntityManager } from "@/components/invoices/BillingEntityManager";
import { ServiceManager } from "@/components/invoices/ServiceManager";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs as InnerTabs, TabsContent as InnerTabsContent, TabsList as InnerTabsList, TabsTrigger as InnerTabsTrigger } from "@/components/ui/tabs";

import {
  Home, Receipt, TrendingUp, BookOpenCheck, FileText,
  Users, Building2, Briefcase, Settings2,
} from "lucide-react";

type WorkspaceKey = "home" | "transactions" | "cashflow" | "accounting" | "billing";

interface Workspace {
  key: WorkspaceKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const WORKSPACES: Workspace[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "cashflow", label: "Cash Flow", icon: TrendingUp },
  { key: "accounting", label: "Accounting", icon: BookOpenCheck },
  { key: "billing", label: "Billing", icon: FileText },
];

/** Billing workspace: invoice list as primary; secondary entities live in drawers. */
const BillingWorkspace = () => {
  const [tab, setTab] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const openEditor = (id: string | null) => { setEditingId(id); setTab("editor"); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === "list" ? "default" : "outline"}
            onClick={() => setTab("list")}
          >
            <FileText className="h-4 w-4 mr-1.5" />Invoices
          </Button>
          <Button
            size="sm"
            variant={tab === "editor" ? "default" : "outline"}
            onClick={() => openEditor(null)}
          >
            New invoice
          </Button>
        </div>
        <div className="flex gap-1.5">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost"><Users className="h-4 w-4 mr-1.5" />Customers</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader><SheetTitle>Customers</SheetTitle></SheetHeader>
              <div className="mt-4"><CustomerManager /></div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost"><Briefcase className="h-4 w-4 mr-1.5" />Services</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader><SheetTitle>Service catalog</SheetTitle></SheetHeader>
              <div className="mt-4"><ServiceManager /></div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost"><Building2 className="h-4 w-4 mr-1.5" />Billing entities</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader><SheetTitle>Billing entities</SheetTitle></SheetHeader>
              <div className="mt-4"><BillingEntityManager /></div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {tab === "list" && <InvoiceList onEdit={(id) => openEditor(id)} onNew={() => openEditor(null)} />}
      {tab === "editor" && <InvoiceEditor invoiceId={editingId} onSaved={(id) => setEditingId(id)} />}
    </div>
  );
};

/** Accounting workspace: trial balance / journals / balance sheet / budget. */
const AccountingWorkspace = () => (
  <InnerTabs defaultValue="trial" className="space-y-4">
    <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-none">
      <InnerTabsList className="inline-flex w-max">
        <InnerTabsTrigger value="trial" className="text-xs sm:text-sm">Trial balance</InnerTabsTrigger>
        <InnerTabsTrigger value="bs" className="text-xs sm:text-sm">Balance sheet</InnerTabsTrigger>
        <InnerTabsTrigger value="groups" className="text-xs sm:text-sm">Chart of accounts</InnerTabsTrigger>
        <InnerTabsTrigger value="budget" className="text-xs sm:text-sm">Budget</InnerTabsTrigger>
      </InnerTabsList>
    </div>
    <InnerTabsContent value="trial"><TrialBalanceView /></InnerTabsContent>
    <InnerTabsContent value="bs"><BalanceSheetView /></InnerTabsContent>
    <InnerTabsContent value="groups"><AccountingGroupsView /></InnerTabsContent>
    <InnerTabsContent value="budget"><BudgetView /></InnerTabsContent>
  </InnerTabs>
);

/** Home workspace placeholder — full FinanceHomeView ships in Phase 2.
 *  For now, surfaces the existing dashboard so the tab is never empty. */
const HomeWorkspace = () => (
  <div className="space-y-4">
    <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Finance Home</span> — a focused landing
      with balances, this-week cash flow, due items, and AI insights is coming next. Today's
      summary is below.
    </div>
    <FinanceDashboardView />
  </div>
);

/** Transactions workspace: bank feed + balances/inputs + credit score in drawers. */
const TransactionsWorkspace = () => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" variant="ghost"><Settings2 className="h-4 w-4 mr-1.5" />Inputs & balances</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader><SheetTitle>Inputs & balances</SheetTitle></SheetHeader>
          <div className="mt-4"><BalancesView /></div>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" variant="ghost">Credit score</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Credit score</SheetTitle></SheetHeader>
          <div className="mt-4"><CreditScoreView /></div>
        </SheetContent>
      </Sheet>
    </div>
    <ActualExpensesView />
  </div>
);

const Finances = () => {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const legacy = params.get("view") || params.get("tab");
  const map: Record<string, WorkspaceKey> = {
    dashboard: "home",
    home: "home",
    expenses: "transactions",
    transactions: "transactions",
    cashflow: "cashflow",
    accounting: "accounting",
    balances: "transactions",
    invoices: "billing",
    billing: "billing",
  };
  const initial: WorkspaceKey = (legacy && map[legacy]) || "home";
  const [active, setActive] = useState<WorkspaceKey>(initial);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", active);
    url.searchParams.delete("tab");
    window.history.replaceState({}, "", url.toString());
  }, [active]);

  return (
    <FinancialDataProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
          <AppSidebar />
          <SidebarRail />

          <SidebarInset className="!min-h-0 h-full overflow-hidden">
            <div className="flex h-full flex-col min-h-0">
              <TopBar title="Finance" />

              {/* Desktop: horizontal tab strip under the top bar */}
              <div className="hidden md:block border-b bg-background">
                <nav className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none">
                  {WORKSPACES.map((w) => {
                    const Icon = w.icon;
                    const isActive = active === w.key;
                    return (
                      <button
                        key={w.key}
                        onClick={() => setActive(w.key)}
                        className={cn(
                          "inline-flex items-center gap-2 h-11 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                          isActive
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {w.label}
                        {w.badge ? (
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{w.badge}</Badge>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-3 md:p-6 space-y-4 md:space-y-6 min-w-0 pb-20 md:pb-6">
                {active === "home" && <HomeWorkspace />}
                {active === "transactions" && <TransactionsWorkspace />}
                {active === "cashflow" && <CashFlowView />}
                {active === "accounting" && <AccountingWorkspace />}
                {active === "billing" && <BillingWorkspace />}
              </div>

              {/* Mobile: bottom tab bar */}
              <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
                aria-label="Finance workspaces"
              >
                <div className="grid grid-cols-5">
                  {WORKSPACES.map((w) => {
                    const Icon = w.icon;
                    const isActive = active === w.key;
                    return (
                      <button
                        key={w.key}
                        onClick={() => setActive(w.key)}
                        className={cn(
                          "flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                        aria-label={w.label}
                      >
                        <div className="relative">
                          <Icon className="h-5 w-5" />
                          {w.badge ? (
                            <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full text-[9px] px-1 leading-none py-0.5">
                              {w.badge}
                            </span>
                          ) : null}
                        </div>
                        <span className="leading-none">{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </FinancialDataProvider>
  );
};

export default Finances;
