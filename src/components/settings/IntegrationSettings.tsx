import { useState, useEffect } from "react";
import { useIntegrations, IntegrationUpdates } from "@/hooks/useIntegrations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Save, MessageCircle, Send, Eye, EyeOff, Shield, AlertTriangle,
  TrendingUp, Mail, Calendar, Building2, Landmark
} from "lucide-react";
import { FinexerSettings } from "./FinexerSettings";

export function IntegrationSettings() {
  const { integrations, isLoading, saveIntegrations } = useIntegrations();
  const [activeTab, setActiveTab] = useState("messaging");
  
  // Messaging
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  
  // Broker
  const [brokerName, setBrokerName] = useState("");
  const [brokerApiKey, setBrokerApiKey] = useState("");
  const [brokerApiSecret, setBrokerApiSecret] = useState("");
  const [brokerAccountId, setBrokerAccountId] = useState("");
  
  // Email
  const [emailProvider, setEmailProvider] = useState("");
  const [emailSmtpHost, setEmailSmtpHost] = useState("");
  const [emailSmtpPort, setEmailSmtpPort] = useState("");
  const [emailSmtpUser, setEmailSmtpUser] = useState("");
  const [emailSmtpPassword, setEmailSmtpPassword] = useState("");
  const [emailImapHost, setEmailImapHost] = useState("");
  const [emailImapPort, setEmailImapPort] = useState("");
  
  // Calendar
  const [calendarProvider, setCalendarProvider] = useState("");
  
  // Visibility toggles
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [showBrokerSecret, setShowBrokerSecret] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  useEffect(() => {
    if (integrations) {
      // Messaging
      setWhatsappPhoneId(integrations.whatsapp_phone_number_id || "");
      setWhatsappToken(integrations.whatsapp_access_token || "");
      setTelegramToken(integrations.telegram_bot_token || "");
      // Broker
      setBrokerName(integrations.broker_name || "");
      setBrokerApiKey(integrations.broker_api_key || "");
      setBrokerApiSecret(integrations.broker_api_secret || "");
      setBrokerAccountId(integrations.broker_account_id || "");
      // Email
      setEmailProvider(integrations.email_provider || "");
      setEmailSmtpHost(integrations.email_smtp_host || "");
      setEmailSmtpPort(integrations.email_smtp_port?.toString() || "");
      setEmailSmtpUser(integrations.email_smtp_user || "");
      setEmailSmtpPassword(integrations.email_smtp_password || "");
      setEmailImapHost(integrations.email_imap_host || "");
      setEmailImapPort(integrations.email_imap_port?.toString() || "");
      // Calendar
      setCalendarProvider(integrations.calendar_provider || "");
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

  useEffect(() => {
    if (showBrokerSecret) {
      const timer = setTimeout(() => setShowBrokerSecret(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showBrokerSecret]);

  useEffect(() => {
    if (showEmailPassword) {
      const timer = setTimeout(() => setShowEmailPassword(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showEmailPassword]);

  const handleSave = () => {
    const updates: IntegrationUpdates = {
      // Messaging
      whatsapp_phone_number_id: whatsappPhoneId.trim() || null,
      whatsapp_access_token: whatsappToken.trim() || null,
      telegram_bot_token: telegramToken.trim() || null,
      // Broker
      broker_name: brokerName.trim() || null,
      broker_api_key: brokerApiKey.trim() || null,
      broker_api_secret: brokerApiSecret.trim() || null,
      broker_account_id: brokerAccountId.trim() || null,
      // Email
      email_provider: emailProvider.trim() || null,
      email_smtp_host: emailSmtpHost.trim() || null,
      email_smtp_port: emailSmtpPort ? parseInt(emailSmtpPort) : null,
      email_smtp_user: emailSmtpUser.trim() || null,
      email_smtp_password: emailSmtpPassword.trim() || null,
      email_imap_host: emailImapHost.trim() || null,
      email_imap_port: emailImapPort ? parseInt(emailImapPort) : null,
      // Calendar
      calendar_provider: calendarProvider.trim() || null,
    };
    saveIntegrations.mutate(updates);
  };

  const PasswordInput = ({ 
    id, value, onChange, placeholder, show, onToggle 
  }: { 
    id: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder: string; 
    show: boolean; 
    onToggle: () => void;
  }) => (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3"
        onClick={onToggle}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );

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
          Never share your API tokens with anyone. If you suspect your credentials have been compromised, regenerate them immediately.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="banking" className="text-xs sm:text-sm">
            <Landmark className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Banking</span>
          </TabsTrigger>
          <TabsTrigger value="messaging" className="text-xs sm:text-sm">
            <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Messaging</span>
          </TabsTrigger>
          <TabsTrigger value="broker" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Broker</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs sm:text-sm">
            <Mail className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">
            <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        {/* Banking/Finexer Tab */}
        <TabsContent value="banking" className="space-y-4 mt-4">
          <FinexerSettings />
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-5 w-5 text-green-500" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription className="text-sm">
                Configure your WhatsApp Business API credentials
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-token">Access Token</Label>
                <PasswordInput
                  id="whatsapp-token"
                  value={whatsappToken}
                  onChange={setWhatsappToken}
                  placeholder="Enter your WhatsApp Access Token"
                  show={showWhatsappToken}
                  onToggle={() => setShowWhatsappToken(!showWhatsappToken)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-5 w-5 text-blue-500" />
                Telegram Bot API
              </CardTitle>
              <CardDescription className="text-sm">
                Configure your Telegram Bot credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-token">Bot Token</Label>
                <PasswordInput
                  id="telegram-token"
                  value={telegramToken}
                  onChange={setTelegramToken}
                  placeholder="Enter your Telegram Bot Token"
                  show={showTelegramToken}
                  onToggle={() => setShowTelegramToken(!showTelegramToken)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your bot token from @BotFather on Telegram
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broker Tab */}
        <TabsContent value="broker" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-primary" />
                Trading Broker
              </CardTitle>
              <CardDescription className="text-sm">
                Connect your brokerage account for trade execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broker-name">Broker</Label>
                <Select value={brokerName} onValueChange={setBrokerName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your broker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alpaca">Alpaca</SelectItem>
                    <SelectItem value="interactive_brokers">Interactive Brokers</SelectItem>
                    <SelectItem value="td_ameritrade">TD Ameritrade</SelectItem>
                    <SelectItem value="tradier">Tradier</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="coinbase">Coinbase</SelectItem>
                    <SelectItem value="kraken">Kraken</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="broker-api-key">API Key</Label>
                <Input
                  id="broker-api-key"
                  value={brokerApiKey}
                  onChange={(e) => setBrokerApiKey(e.target.value)}
                  placeholder="Enter your broker API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="broker-api-secret">API Secret</Label>
                <PasswordInput
                  id="broker-api-secret"
                  value={brokerApiSecret}
                  onChange={setBrokerApiSecret}
                  placeholder="Enter your broker API secret"
                  show={showBrokerSecret}
                  onToggle={() => setShowBrokerSecret(!showBrokerSecret)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="broker-account-id">Account ID (optional)</Label>
                <Input
                  id="broker-account-id"
                  value={brokerAccountId}
                  onChange={(e) => setBrokerAccountId(e.target.value)}
                  placeholder="Enter your account ID if required"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5 text-orange-500" />
                Email Configuration
              </CardTitle>
              <CardDescription className="text-sm">
                Configure your email account for sending and receiving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-provider">Email Provider</Label>
                <Select value={emailProvider} onValueChange={setEmailProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your email provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
                    <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                    <SelectItem value="custom">Custom SMTP/IMAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {emailProvider === "custom" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={emailSmtpHost}
                        onChange={(e) => setEmailSmtpHost(e.target.value)}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={emailSmtpPort}
                        onChange={(e) => setEmailSmtpPort(e.target.value)}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imap-host">IMAP Host</Label>
                      <Input
                        id="imap-host"
                        value={emailImapHost}
                        onChange={(e) => setEmailImapHost(e.target.value)}
                        placeholder="imap.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-port">IMAP Port</Label>
                      <Input
                        id="imap-port"
                        type="number"
                        value={emailImapPort}
                        onChange={(e) => setEmailImapPort(e.target.value)}
                        placeholder="993"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Email Address</Label>
                    <Input
                      id="smtp-user"
                      type="email"
                      value={emailSmtpUser}
                      onChange={(e) => setEmailSmtpUser(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">App Password</Label>
                    <PasswordInput
                      id="smtp-password"
                      value={emailSmtpPassword}
                      onChange={setEmailSmtpPassword}
                      placeholder="Enter your app password"
                      show={showEmailPassword}
                      onToggle={() => setShowEmailPassword(!showEmailPassword)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use an app-specific password, not your regular password
                    </p>
                  </div>
                </>
              )}

              {(emailProvider === "gmail" || emailProvider === "outlook") && (
                <Alert>
                  <AlertDescription className="text-sm">
                    For {emailProvider === "gmail" ? "Gmail" : "Outlook"}, OAuth authentication is recommended. 
                    Click the button below to connect your account securely.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-purple-500" />
                Calendar Integration
              </CardTitle>
              <CardDescription className="text-sm">
                Connect your calendar for event synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-provider">Calendar Provider</Label>
                <Select value={calendarProvider} onValueChange={setCalendarProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your calendar provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="outlook">Outlook Calendar</SelectItem>
                    <SelectItem value="apple">Apple Calendar (iCloud)</SelectItem>
                    <SelectItem value="caldav">CalDAV (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calendarProvider && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Calendar integration requires OAuth authentication. 
                    Click the button below to connect your {calendarProvider === "google" ? "Google" : calendarProvider === "outlook" ? "Outlook" : calendarProvider === "apple" ? "iCloud" : "calendar"} account securely.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSave}
        disabled={saveIntegrations.isPending}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {saveIntegrations.isPending ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
