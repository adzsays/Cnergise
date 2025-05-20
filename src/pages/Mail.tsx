
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail as MailIcon, Star, Trash, Send, Archive, Bookmark } from "lucide-react";

export default function Mail() {
  const [activeTab, setActiveTab] = React.useState("inbox");
  
  const emails = [
    {
      id: 1,
      sender: "John Doe",
      subject: "Weekly Team Update",
      preview: "Here's the summary of our progress this week...",
      time: "10:30 AM",
      read: false,
      avatar: "JD"
    },
    {
      id: 2,
      sender: "Jane Smith",
      subject: "Project Milestone Reached",
      preview: "I'm pleased to announce that we've reached...",
      time: "Yesterday",
      read: true,
      avatar: "JS"
    },
    {
      id: 3,
      sender: "Mark Johnson",
      subject: "New Design Proposal",
      preview: "Attached you'll find the new design proposal...",
      time: "Apr 21",
      read: true,
      avatar: "MJ"
    },
    {
      id: 4,
      sender: "Sarah Wilson",
      subject: "Upcoming Conference",
      preview: "We should consider attending the upcoming...",
      time: "Apr 20",
      read: false,
      avatar: "SW"
    },
    {
      id: 5,
      sender: "Alex Brown",
      subject: "Budget Review",
      preview: "Can we schedule a meeting to discuss the budget...",
      time: "Apr 15",
      read: true,
      avatar: "AB"
    }
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <h1 className="text-2xl font-bold gradient-heading">Mail</h1>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </div>
            </header>
            
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { value: "inbox", label: "Inbox" },
                { value: "sent", label: "Sent" },
                { value: "drafts", label: "Drafts" },
                { value: "trash", label: "Trash" }
              ]}
              actions={
                <Button variant="outline" size="sm">
                  <MailIcon className="mr-2 h-4 w-4" />
                  Compose
                </Button>
              }
            />
            
            <div className="flex-1 overflow-auto p-6">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="inbox" className="mt-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Inbox</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {emails.map((email) => (
                          <div 
                            key={email.id} 
                            className={`py-3 px-1 flex items-center gap-4 hover:bg-muted/50 cursor-pointer rounded-md ${!email.read ? 'font-medium' : ''}`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{email.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm ${!email.read ? 'font-medium' : ''}`}>{email.sender}</span>
                                <span className="text-xs text-muted-foreground">{email.time}</span>
                              </div>
                              <p className="text-sm truncate">{email.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                            </div>
                            {!email.read && (
                              <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="sent">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Sent</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Send className="mx-auto h-12 w-12 opacity-20 mb-2" />
                        <p>No sent emails to display</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="drafts">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Drafts</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Archive className="mx-auto h-12 w-12 opacity-20 mb-2" />
                        <p>No drafts saved</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="trash">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Trash</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Trash className="mx-auto h-12 w-12 opacity-20 mb-2" />
                        <p>Trash is empty</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
