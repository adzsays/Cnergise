import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Smartphone, Mail, Monitor } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useNotificationPermission } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

export function NotificationSettings() {
  const { data: prefs, update } = useNotificationPreferences();
  const { permission, enable, isNative } = useNotificationPermission();
  const { toast } = useToast();
  const [enabling, setEnabling] = useState(false);

  if (!prefs) return null;

  const handleEnablePush = async () => {
    setEnabling(true);
    const ok = await enable();
    setEnabling(false);
    toast({
      title: ok ? "Push enabled" : "Push not enabled",
      description: ok ? "You'll receive notifications on this device." : "Permission was not granted.",
      variant: ok ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Channels</CardTitle>
          <CardDescription>Choose how you want to be alerted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row icon={<Bell className="h-4 w-4" />} label="In-app notifications" checked={prefs.in_app_enabled} onChange={(v) => update.mutate({ in_app_enabled: v })} />
          <Row icon={<Monitor className="h-4 w-4" />} label="Browser/desktop push" checked={prefs.web_push_enabled} onChange={(v) => update.mutate({ web_push_enabled: v })} />
          <Row icon={<Smartphone className="h-4 w-4" />} label="Mobile push (native app)" checked={prefs.native_push_enabled} onChange={(v) => update.mutate({ native_push_enabled: v })} />
          <Row icon={<Mail className="h-4 w-4" />} label="Email reminders" checked={prefs.email_enabled} onChange={(v) => update.mutate({ email_enabled: v })} />

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              {isNative ? "Native app detected" : `Browser permission: ${permission}`}
            </p>
            <Button onClick={handleEnablePush} disabled={enabling} size="sm">
              {permission === "granted" && !isNative ? <><BellOff className="h-4 w-4 mr-2" /> Re-enable on this device</> : <><Bell className="h-4 w-4 mr-2" /> Enable push on this device</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Lead Times</CardTitle>
          <CardDescription>How early to remind you (minutes before).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <LeadField label="Events / Meetings" value={prefs.event_lead_minutes} onSave={(v) => update.mutate({ event_lead_minutes: v })} />
          <LeadField label="Tasks" value={prefs.task_lead_minutes} onSave={(v) => update.mutate({ task_lead_minutes: v })} />
          <LeadField label="Payments" value={prefs.payment_lead_minutes} onSave={(v) => update.mutate({ payment_lead_minutes: v })} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="flex items-center gap-2">{icon}{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function LeadField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(value);
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input type="number" value={v} onChange={(e) => setV(parseInt(e.target.value) || 0)} className="h-9" />
        <Button size="sm" variant="outline" onClick={() => onSave(v)}>Save</Button>
      </div>
    </div>
  );
}
