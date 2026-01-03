
import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bookmark } from "lucide-react";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              actions={
                <Button variant="outline" size="sm">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmark
                </Button>
              }
            />
            
            <div className="flex-1 overflow-auto p-6">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent</CardTitle>
                      </CardHeader>
                      <CardContent className="h-60 flex items-center justify-center text-muted-foreground">
                        Your recent opened items will show here.
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Docs</CardTitle>
                      </CardHeader>
                      <CardContent className="h-60 flex items-center justify-center text-muted-foreground">
                        You haven't added any Docs to this location.
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Bookmarks</CardTitle>
                      </CardHeader>
                      <CardContent className="h-60 flex flex-col items-center justify-center gap-3 text-center">
                        <Bookmark className="h-12 w-12 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground max-w-52">
                          Bookmarks are the easiest way to save ClickUp items or URLs from anywhere on the web
                        </div>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Bookmark
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Folders</CardTitle>
                      </CardHeader>
                      <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
                        No folders to show
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="list">
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <h3 className="text-lg font-medium">List View</h3>
                    <p className="text-muted-foreground mt-2">
                      This is the list view of the dashboard.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="board">
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <h3 className="text-lg font-medium">Board View</h3>
                    <p className="text-muted-foreground mt-2">
                      This is the board view of the dashboard.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
        <VoiceAssistant />
      </div>
    </SidebarProvider>
  );
}
