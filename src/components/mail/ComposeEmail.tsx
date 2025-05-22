
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Paperclip, Minimize2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComposeEmailProps {
  onClose: () => void;
  minimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  emailService?: EmailService | null;
}

export interface EmailService {
  id: string;
  name: string;
  email: string;
  provider: "gmail" | "outlook" | "other";
  connected: boolean;
}

export function ComposeEmail({ 
  onClose, 
  minimized = false,
  onMinimize,
  onMaximize,
  emailService
}: ComposeEmailProps) {
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const handleSendEmail = async () => {
    if (!to || !subject || !message) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields before sending",
        variant: "destructive"
      });
      return;
    }
    
    if (!emailService?.connected) {
      toast({
        title: "No email service connected",
        description: "Please connect an email service in settings first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    // Simulate sending email
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Email sent",
        description: `Your email to ${to} has been sent successfully`,
      });
      setTo("");
      setSubject("");
      setMessage("");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-4 w-80 bg-background rounded-t-md shadow-lg border">
        <div className="p-3 border-b flex items-center justify-between cursor-pointer"
          onClick={onMaximize}>
          <h3 className="font-medium">New Message</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 w-[500px] bg-background rounded-t-md shadow-lg border flex flex-col" 
      style={{ height: "60vh", maxHeight: "600px" }}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-medium">New Message</h3>
          {emailService && (
            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
              {emailService.email}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
        <div>
          <Label htmlFor="to">To:</Label>
          <Input 
            id="to" 
            placeholder="recipient@example.com" 
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject:</Label>
          <Input 
            id="subject" 
            placeholder="Enter subject" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Textarea 
            className="min-h-[200px] h-full" 
            placeholder="Write your message here..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-3 border-t flex items-center justify-between">
        <div className="flex gap-2">
          <Button 
            onClick={handleSendEmail} 
            disabled={isSending || !emailService?.connected}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
          <Button variant="outline" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Discard
        </Button>
      </div>
    </div>
  );
}
