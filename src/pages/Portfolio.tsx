import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StrategyManager } from "@/components/portfolio/StrategyManager";
import { BundleManager } from "@/components/portfolio/BundleManager";
import { RiskAppetite } from "@/components/portfolio/RiskAppetite";
import { RiskManager } from "@/components/portfolio/RiskManager";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Portfolio() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [activeTab, setActiveTab] = React.useState(params.get("tab") || "strategies");
  const [riskBand, setRiskBand] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("risk_profiles").select("risk_band").eq("user_id", user.id).maybeSingle();
      if (data?.risk_band) setRiskBand(data.risk_band);
    })();
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden h-9 w-9" />
                  <h1 className="text-2xl font-bold gradient-heading">Trading Strategies</h1>
                </div>
              </div>
            </header>

            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { value: "strategies", label: "Strategies" },
                { value: "bundles", label: "Bundles" },
                { value: "risk", label: "Risk Profile" },
                { value: "limits", label: "Limits" },
              ]}
            />

            <div className="flex-1 overflow-auto p-3 md:p-6 pb-[env(safe-area-inset-bottom)]">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="strategies" className="mt-0 space-y-4">
                  <StrategyManager />
                </TabsContent>
                <TabsContent value="bundles" className="mt-0 space-y-4">
                  <BundleManager riskBand={riskBand} />
                </TabsContent>
                <TabsContent value="risk" className="mt-0 space-y-4">
                  <RiskAppetite onAssessed={(b) => setRiskBand(b)} />
                </TabsContent>
                <TabsContent value="limits" className="mt-0 space-y-4">
                  <RiskManager />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
