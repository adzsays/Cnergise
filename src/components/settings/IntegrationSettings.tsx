import { useState, useEffect } from "react";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, MessageCircle, Send, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";

export function IntegrationSettings() {
  const { integrations, isLoading, saveIntegrations } = useIntegrations();
  
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  useEffect(() => {
    if (integrations) {
      setWhatsappPhoneId(integrations.whatsapp_phone_number_id || "");
      setWhatsappToken(integrations.whatsapp_access_token || "");
      setTelegramToken(integrations.telegram_bot_token || "");
    }
  }, [integrations]);

  // Auto-hide tokens after 30 seconds
  useEffect(() => {
    if (showWhatsappToken) {
      const timer = setTimeout(() => setShowWhatsappToken(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showWhatsappToken]);

  useEffect(() => {
    if (showTelegramToken) {
      const timer = setTimeout(() => setShowTelegramToken(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showTelegramToken]);

  const handleSave = () => {
    saveIntegrations.mutate({
      whatsapp_phone_number_id: whatsappPhoneId.trim() || null,
      whatsapp_access_token: whatsappToken.trim() || null,
      telegram_bot_token: telegramToken.trim() || null,
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert className="border-primary/20 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your API credentials are encrypted and stored securely. They are only accessible to you and protected by row-level security policies.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Never share your API tokens with anyone. If you suspect your tokens have been compromised, regenerate them immediately from the respective platforms.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Configure your WhatsApp Business API credentials to send messages to contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
            <Input
              id="whatsapp-phone-id"
              value={whatsappPhoneId}
              onChange={(e) => setWhatsappPhoneId(e.target.value)}
              placeholder="Enter your WhatsApp Phone Number ID"
            />
            <p className="text-xs text-muted-foreground">
              Found in your Meta Business Suite under WhatsApp Business API settings
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp-token">Access Token</Label>
            <div className="relative">
              <Input
                id="whatsapp-token"
                type={showWhatsappToken ? "text" : "password"}
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
                placeholder="Enter your WhatsApp Access Token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowWhatsappToken(!showWhatsappToken)}
              >
                {showWhatsappToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate a permanent access token in your Meta Developer portal
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            Telegram Bot API
          </CardTitle>
          <CardDescription>
            Configure your Telegram Bot credentials to send messages to contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegram-token">Bot Token</Label>
            <div className="relative">
              <Input
                id="telegram-token"
                type={showTelegramToken ? "text" : "password"}
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="Enter your Telegram Bot Token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowTelegramToken(!showTelegramToken)}
              >
                {showTelegramToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your bot token from @BotFather on Telegram
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saveIntegrations.isPending}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {saveIntegrations.isPending ? "Saving..." : "Save Integration Settings"}
      </Button>
    </div>
  );
}
