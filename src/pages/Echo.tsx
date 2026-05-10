import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import EchoView from "@/components/echo/EchoView";

export default function Echo() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-[100dvh] flex w-full bg-background">
        <AppSidebar />
        <SidebarRail />
        <SidebarInset className="flex flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <header className="mb-4">
                <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">Echo</h1>
                <p className="text-sm text-muted-foreground">
                  Speak or jot your day — Echo auto-categorises it.
                </p>
              </header>
              <EchoView />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
