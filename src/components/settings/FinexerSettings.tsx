import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useProfile } from "@/hooks/useProfile";

export function FinexerSettings() {
  const { settings, isLoading, upsertSetting, getSetting } = useSystemSettings();
  const { roles } = useProfile();
  const isAdmin = roles?.some(r => r.role === 'admin');

  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(getSetting('finexer_api_key') || "");
      setSecretKey(getSetting('finexer_secret_key') || "");
    }
  }, [settings]);

  // Auto-hide sensitive fields after 30 seconds
  useEffect(() => {
    if (showApiKey) {
      const timer = setTimeout(() => setShowApiKey(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showApiKey]);

  useEffect(() => {
    if (showSecretKey) {
      const timer = setTimeout(() => setShowSecretKey(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showSecretKey]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertSetting.mutateAsync({ key: 'finexer_api_key', value: apiKey });
      await upsertSetting.mutateAsync({ key: 'finexer_secret_key', value: secretKey });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access these settings. Admin access required.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Finexer Open Banking Integration
        </CardTitle>
        <CardDescription>
          Configure your Finexer API credentials for bank account synchronization.
          Only administrators can view and modify these settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            These credentials are stored securely and only accessible to administrators.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="finexer-api-key">Finexer API Key</Label>
          <div className="relative">
            <Input
              id="finexer-api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Finexer API key"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finexer-secret-key">Finexer Secret Key</Label>
          <div className="relative">
            <Input
              id="finexer-secret-key"
              type={showSecretKey ? "text" : "password"}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your Finexer secret key"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowSecretKey(!showSecretKey)}
            >
              {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Finexer Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
