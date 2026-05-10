import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Newspaper, Sparkles, Bot } from "lucide-react";
import { NewsFeed } from "@/components/social/NewsFeed";
import { ImpactInbox } from "@/components/social/ImpactInbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SocialMedia = () => {
  const [activeTab, setActiveTab] = useState("impact");
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const runScan = async () => {
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("listening-agent-scan", { body: {} });
    setScanning(false);
    toast({
      title: error ? "Scan failed" : "Scan complete",
      description: error?.message ?? `Surfaced ${data?.scored ?? 0} of ${data?.total ?? 0} items.`,
      variant: error ? "destructive" : "default",
    });
  };

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
                  <div>
                    <h1 className="text-2xl font-bold gradient-heading flex items-center gap-2">
                      <Bot className="h-6 w-6 text-primary" />
                      Social Listener
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      AI listens across your channels — only what matters, no platform clutter.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={runScan} disabled={scanning}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
                    {scanning ? "Scanning…" : "Run scan"}
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-none">
                  <TabsList className="inline-flex w-max">
                    <TabsTrigger value="impact" className="gap-2 text-xs sm:text-sm">
                      <Sparkles className="h-4 w-4" />
                      <span>What needs you</span>
                    </TabsTrigger>
                    <TabsTrigger value="news" className="gap-2 text-xs sm:text-sm">
                      <Newspaper className="h-4 w-4" />
                      News
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="impact">
                  <ImpactInbox />
                </TabsContent>

                <TabsContent value="news">
                  <NewsFeed />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SocialMedia;
