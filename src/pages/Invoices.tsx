import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Building2, ListChecks } from "lucide-react";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { CustomerManager } from "@/components/invoices/CustomerManager";
import { BillingEntityManager } from "@/components/invoices/BillingEntityManager";

const Invoices = () => {
  const [tab, setTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const openEditor = (id: string | null) => {
    setEditingId(id);
    setTab("editor");
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Invoicing" />
            <div className="flex-1 overflow-auto p-3 md:p-6">
              <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="list"><ListChecks className="h-4 w-4 mr-1" />Invoices</TabsTrigger>
                  <TabsTrigger value="editor"><FileText className="h-4 w-4 mr-1" />Editor</TabsTrigger>
                  <TabsTrigger value="customers"><Users className="h-4 w-4 mr-1" />Customers</TabsTrigger>
                  <TabsTrigger value="entities"><Building2 className="h-4 w-4 mr-1" />Billing entities</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <InvoiceList onEdit={(id) => openEditor(id)} onNew={() => openEditor(null)} />
                </TabsContent>
                <TabsContent value="editor">
                  <InvoiceEditor invoiceId={editingId} onSaved={(id) => setEditingId(id)} />
                </TabsContent>
                <TabsContent value="customers"><CustomerManager /></TabsContent>
                <TabsContent value="entities"><BillingEntityManager /></TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Invoices;
