import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";
import { BarChart3 } from "lucide-react";

export default function Monitoring() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                System Monitoring
              </h1>
              <p className="text-muted-foreground mt-2">
                Track errors, performance metrics, and database usage
              </p>
            </div>
            <MonitoringDashboard />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
