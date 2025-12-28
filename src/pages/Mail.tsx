import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MailboxLayout } from "@/components/mail/MailboxLayout";
import { EmailDetails } from "@/components/mail/EmailDetails";
import { ComposeEmail, EmailService } from "@/components/mail/ComposeEmail";
import { useToast } from "@/hooks/use-toast";

export default function Mail() {
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [emailServices, setEmailServices] = useState<EmailService[]>([]);
  const [defaultServiceId, setDefaultServiceId] = useState<string | undefined>();
  const [activeServiceId, setActiveServiceId] = useState<string | undefined>();
  
  const emails = [
    {
      id: 1,
      sender: "John Doe",
      subject: "Weekly Team Update",
      preview: "Here's the summary of our progress this week...",
      content: "Hello team,\n\nHere's the summary of our progress this week. We've made significant strides in the project development and are on track to meet our deadlines.\n\nBest regards,\nJohn",
      time: "10:30 AM",
      read: false,
      avatar: "JD",
      to: ["me@example.com"],
      cc: ["team@example.com"],
      folder: "inbox"
    },
    {
      id: 2,
      sender: "Jane Smith",
      subject: "Project Milestone Reached",
      preview: "I'm pleased to announce that we've reached...",
      time: "Yesterday",
      read: true,
      avatar: "JS",
      to: ["me@example.com", "team@example.com"],
      folder: "inbox"
    },
    {
      id: 3,
      sender: "Mark Johnson",
      subject: "New Design Proposal",
      preview: "Attached you'll find the new design proposal...",
      time: "Apr 21",
      read: true,
      avatar: "MJ",
      to: ["me@example.com"],
      folder: "inbox",
      attachments: [
        { name: "design_proposal.pdf", size: "2.4 MB" },
        { name: "mockup.jpg", size: "1.1 MB" }
      ]
    },
    {
      id: 4,
      sender: "Sarah Wilson",
      subject: "Upcoming Conference",
      preview: "We should consider attending the upcoming...",
      time: "Apr 20",
      read: false,
      avatar: "SW",
      to: ["me@example.com"],
      folder: "starred"
    },
    {
      id: 5,
      sender: "Alex Brown",
      subject: "Budget Review",
      preview: "Can we schedule a meeting to discuss the budget...",
      time: "Apr 15",
      read: true,
      avatar: "AB",
      to: ["me@example.com", "finance@example.com"],
      folder: "sent"
    }
  ];
  
  const handleAddEmailService = (service: EmailService) => {
    setEmailServices((prev) => [...prev, service]);
    
    // Set as default if it's the first one
    if (emailServices.length === 0) {
      setDefaultServiceId(service.id);
      setActiveServiceId(service.id);
    }
  };
  
  const handleRemoveEmailService = (id: string) => {
    setEmailServices((prev) => prev.filter(service => service.id !== id));
    
    // If removing the default, set a new default
    if (defaultServiceId === id) {
      const remaining = emailServices.filter(service => service.id !== id);
      if (remaining.length > 0) {
        setDefaultServiceId(remaining[0].id);
        setActiveServiceId(remaining[0].id);
      } else {
        setDefaultServiceId(undefined);
        setActiveServiceId(undefined);
      }
    }
    
    toast({
      title: "Email account removed",
      description: "The email account has been removed from your mailbox.",
    });
  };
  
  const handleSetDefaultService = (id: string) => {
    setDefaultServiceId(id);
    toast({
      title: "Default email updated",
      description: "Your default email account has been updated.",
    });
  };
  
  const getCurrentEmailService = () => {
    if (!activeServiceId) return null;
    return emailServices.find(service => service.id === activeServiceId) || null;
  };

  const filteredEmails = emails.filter(email => {
    if (activeFolder === "starred") return email.folder === "starred";
    if (activeFolder === "sent") return email.folder === "sent";
    return email.folder === activeFolder;
  });
  
  const selectedEmailData = selectedEmail !== null
    ? emails.find(email => email.id === selectedEmail) || null
    : null;

  const handleEmailClick = (emailId: number) => {
    setSelectedEmail(emailId);
  };

  return (
    <SidebarProvider defaultOpen={false}>
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
            
            <div className="flex-1 overflow-hidden">
              <MailboxLayout
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                onCompose={() => {
                  setComposeOpen(true);
                  setComposeMinimized(false);
                }}
                activeFolder={activeFolder}
                onFolderChange={setActiveFolder}
                emailCount={{
                  inbox: 3,
                  starred: 1,
                  draft: 0,
                  sent: 1
                }}
                emailServices={emailServices}
                onAddEmailService={handleAddEmailService}
                onRemoveEmailService={handleRemoveEmailService}
                onSetDefaultService={handleSetDefaultService}
                defaultServiceId={defaultServiceId}
                activeServiceId={activeServiceId}
                onChangeService={setActiveServiceId}
              >
                {selectedEmail === null ? (
                  <div className="divide-y">
                    {filteredEmails.length > 0 ? (
                      filteredEmails.map((email) => (
                        <div 
                          key={email.id} 
                          className={`py-3 px-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer ${!email.read ? 'bg-primary/5' : ''}`}
                          onClick={() => handleEmailClick(email.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${email.sender.replace(" ", "+")}`} />
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
                          {email.attachments && (
                            <span className="text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                              </svg>
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                        </div>
                        <p className="text-xl font-medium">No emails found</p>
                        <p className="text-muted-foreground">This folder is empty</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmailDetails 
                    email={selectedEmailData} 
                    onClose={() => setSelectedEmail(null)} 
                  />
                )}
              </MailboxLayout>
            </div>
          </div>
        </SidebarInset>
      </div>
      
      {composeOpen && (
        <ComposeEmail 
          onClose={() => setComposeOpen(false)}
          minimized={composeMinimized}
          onMinimize={() => setComposeMinimized(true)}
          onMaximize={() => setComposeMinimized(false)}
          emailService={getCurrentEmailService()}
        />
      )}
    </SidebarProvider>
  );
}
