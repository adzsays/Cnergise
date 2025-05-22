
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Paperclip, Minimize2, Maximize2 } from "lucide-react";

interface ComposeEmailProps {
  onClose: () => void;
  minimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export function ComposeEmail({ 
  onClose, 
  minimized = false,
  onMinimize,
  onMaximize
}: ComposeEmailProps) {
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
        <h3 className="font-medium">New Message</h3>
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
          <Input id="to" placeholder="recipient@example.com" />
        </div>
        <div>
          <Label htmlFor="subject">Subject:</Label>
          <Input id="subject" placeholder="Enter subject" />
        </div>
        <div className="flex-1">
          <Textarea 
            className="min-h-[200px] h-full" 
            placeholder="Write your message here..." 
          />
        </div>
      </div>
      
      <div className="p-3 border-t flex items-center justify-between">
        <div className="flex gap-2">
          <Button>Send</Button>
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
