import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { Settings as SettingsIcon, Link } from "lucide-react";

export default function Settings() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <SettingsIcon className="h-8 w-8" />
                Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your account and integration settings
              </p>
            </div>

            <Tabs defaultValue="integrations" className="w-full">
              <TabsList>
                <TabsTrigger value="integrations" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Integrations
                </TabsTrigger>
              </TabsList>
              <TabsContent value="integrations" className="mt-6">
                <IntegrationSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
