
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, Forward, Trash, Archive, Star } from "lucide-react";

interface EmailDetailsProps {
  email: {
    id: number;
    sender: string;
    subject: string;
    content?: string;
    time: string;
    avatar: string;
    to: string[];
    cc?: string[];
    attachments?: {name: string, size: string}[];
  } | null;
  onClose: () => void;
}

export function EmailDetails({ email, onClose }: EmailDetailsProps) {
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select an email to view its contents</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{email.subject}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Back
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${email.sender.replace(" ", "+")}`} />
            <AvatarFallback>{email.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{email.sender}</p>
            <p className="text-sm text-muted-foreground">
              To: {email.to.join(", ")}
              {email.cc && email.cc.length > 0 && (
                <>
                  <br />
                  CC: {email.cc.join(", ")}
                </>
              )}
            </p>
          </div>
          <span className="ml-auto text-sm text-muted-foreground">{email.time}</span>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline" size="sm">
            <Forward className="mr-2 h-4 w-4" />
            Forward
          </Button>
          <Button variant="outline" size="sm">
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button variant="outline" size="sm" className="ml-auto">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="p-4 overflow-auto flex-1">
        <div className="prose prose-sm max-w-none">
          {email.content || (
            <>
              <p>Hello,</p>
              <p>
                Thank you for your email. I'm writing to follow up on our recent 
                discussion about the project timeline. As mentioned in our meeting,
                we need to adjust some of the milestones to accommodate the new 
                requirements.
              </p>
              <p>
                Here's a summary of the key points we discussed:
              </p>
              <ul>
                <li>The design phase will be extended by one week</li>
                <li>We'll need to conduct additional user testing</li>
                <li>The final delivery date remains unchanged</li>
              </ul>
              <p>
                Please let me know if you have any questions or concerns.
              </p>
              <p>Best regards,<br />{email.sender}</p>
            </>
          )}
        </div>
        
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Attachments ({email.attachments.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {email.attachments.map((attachment, index) => (
                <div key={index} className="border rounded p-3 flex items-center gap-2">
                  <div className="bg-muted h-10 w-10 flex items-center justify-center rounded">
                    <span className="text-xs">{attachment.name.split('.').pop()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{attachment.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
