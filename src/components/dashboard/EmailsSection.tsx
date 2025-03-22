
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmailsSectionProps {
  projectFilter: string;
}

export function EmailsSection({ projectFilter }: EmailsSectionProps) {
  // Mock emails data
  const allEmailsData = [
    {
      id: 1,
      sender: "Sarah Johnson",
      subject: "Project kickoff meeting notes",
      preview: "Hey team, I've attached the notes from our kickoff meeting yesterday...",
      time: "10:32 AM",
      read: false,
      projectId: "website",
    },
    {
      id: 2,
      sender: "Mike Peterson",
      subject: "Invoice #3245 for Website Redesign",
      preview: "Please find attached the invoice for the first phase of the website...",
      time: "Yesterday",
      read: true,
      projectId: "website",
    },
    {
      id: 3,
      sender: "Client Review Team",
      subject: "Feedback on marketing materials",
      preview: "We've reviewed the materials and have a few suggestions for improvements...",
      time: "Aug 21",
      read: true,
      projectId: "marketing",
    },
    {
      id: 4,
      sender: "API Team",
      subject: "Mobile API endpoints ready for testing",
      preview: "The new API endpoints are now available in the staging environment...",
      time: "Aug 20",
      read: false,
      projectId: "mobile",
    },
  ];

  // Filter emails by project if needed
  const emailsData = projectFilter === "all" 
    ? allEmailsData 
    : allEmailsData.filter(email => email.projectId === projectFilter);

  return (
    <div className="space-y-3">
      {emailsData.length > 0 ? (
        <>
          {emailsData.map((email) => (
            <div
              key={email.id}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                !email.read && "bg-primary/5"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${email.sender.replace(" ", "+")}`} />
                <AvatarFallback>{email.sender.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("font-medium", !email.read && "font-semibold")}>
                    {email.sender}
                  </p>
                  <p className="text-xs text-muted-foreground">{email.time}</p>
                </div>
                <p className="text-sm font-medium mt-0.5 truncate">{email.subject}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {email.preview}
                </p>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Emails
          </Button>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No emails found for the selected project.
        </div>
      )}
    </div>
  );
}
