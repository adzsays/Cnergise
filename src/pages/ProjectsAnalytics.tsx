import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectAnalyticsDashboard } from "@/components/projects/ProjectAnalyticsDashboard";

export default function ProjectsAnalytics() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Projects" />

            <main className="flex-1 overflow-auto p-4 md:p-6">
              <ProjectAnalyticsDashboard />
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
