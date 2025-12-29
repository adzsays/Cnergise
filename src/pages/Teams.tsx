import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TeamsTab } from "@/components/tasks/TeamsTab";

const Teams = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <div>
                  <h1 className="text-2xl font-bold gradient-heading">Teams</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your teams and team members
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
              <TeamsTab />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Teams;
