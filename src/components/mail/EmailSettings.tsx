
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Check, Settings, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailService } from "./ComposeEmail";

interface EmailSettingsProps {
  emailServices: EmailService[];
  onAddEmailService: (service: EmailService) => void;
  onRemoveEmailService: (id: string) => void;
  onSetDefaultService: (id: string) => void;
  defaultServiceId?: string;
}

export function EmailSettings({
  emailServices,
  onAddEmailService,
  onRemoveEmailService,
  onSetDefaultService,
  defaultServiceId
}: EmailSettingsProps) {
  const { toast } = useToast();
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newProvider, setNewProvider] = useState<"gmail" | "outlook" | "other">("gmail");
  
  const handleConnectGmail = async () => {
    // In a real implementation, this would initiate OAuth2 flow with Google
    toast({
      title: "Connect with Gmail",
      description: "This would open Gmail OAuth authentication in a real implementation.",
    });
    
    // Simulate successful OAuth completion
    setTimeout(() => {
      const newService: EmailService = {
        id: `gmail-${Date.now()}`,
        name: "Gmail",
        email: newEmail || "user@gmail.com",
        provider: "gmail",
        connected: true
      };
      
      onAddEmailService(newService);
      setIsAddingEmail(false);
      setNewEmail("");
      
      toast({
        title: "Gmail connected successfully",
        description: "Your Gmail account is now connected.",
      });
    }, 1500);
  };
  
  const handleConnectOutlook = async () => {
    // Similar to Gmail but for Outlook
    toast({
      title: "Connect with Outlook",
      description: "This would open Outlook OAuth authentication in a real implementation.",
    });
    
    setTimeout(() => {
      const newService: EmailService = {
        id: `outlook-${Date.now()}`,
        name: "Outlook",
        email: newEmail || "user@outlook.com",
        provider: "outlook",
        connected: true
      };
      
      onAddEmailService(newService);
      setIsAddingEmail(false);
      setNewEmail("");
    }, 1500);
  };
  
  const handleAddManual = () => {
    if (!newEmail) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    const newService: EmailService = {
      id: `other-${Date.now()}`,
      name: "Custom Email",
      email: newEmail,
      provider: "other",
      connected: true
    };
    
    onAddEmailService(newService);
    setIsAddingEmail(false);
    setNewEmail("");
    
    toast({
      title: "Email account added",
      description: "Your email account has been added. Note: Email sending is simulated.",
    });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" /> 
          Email Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Email Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Connected Email Accounts</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsAddingEmail(true)}
            >
              <Plus className="h-3 w-3" /> Add Account
            </Button>
          </div>
          
          {emailServices.length === 0 ? (
            <div className="text-center py-6 bg-muted/50 rounded-md">
              <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No email accounts connected</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsAddingEmail(true)}
              >
                Connect an email account
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {emailServices.map(service => (
                <div 
                  key={service.id} 
                  className="flex items-center justify-between py-2 px-3 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      {service.provider === 'gmail' && 'G'}
                      {service.provider === 'outlook' && 'O'}
                      {service.provider === 'other' && '#'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{service.email}</p>
                      <p className="text-xs text-muted-foreground">{service.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {defaultServiceId !== service.id && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSetDefaultService(service.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    {defaultServiceId === service.id && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded flex items-center gap-1">
                        <Check className="h-3 w-3" /> Default
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onRemoveEmailService(service.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isAddingEmail && (
            <div className="border rounded-md p-4 space-y-4 mt-4">
              <h4 className="text-sm font-medium">Add Email Account</h4>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={newProvider === "gmail" ? "default" : "outline"}
                    size="sm" 
                    onClick={() => setNewProvider("gmail")}
                  >
                    Gmail
                  </Button>
                  <Button 
                    variant={newProvider === "outlook" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewProvider("outlook")}
                  >
                    Outlook
                  </Button>
                  <Button 
                    variant={newProvider === "other" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewProvider("other")}
                  >
                    Other
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingEmail(false)}
                >
                  Cancel
                </Button>
                
                {newProvider === "gmail" && (
                  <Button onClick={handleConnectGmail}>
                    Connect with Gmail
                  </Button>
                )}
                
                {newProvider === "outlook" && (
                  <Button onClick={handleConnectOutlook}>
                    Connect with Outlook
                  </Button>
                )}
                
                {newProvider === "other" && (
                  <Button onClick={handleAddManual}>
                    Add Account
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
