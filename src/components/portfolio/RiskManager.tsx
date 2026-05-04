import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const FIELDS: { key: string; label: string; suffix?: string }[] = [
  { key: "max_position_pct", label: "Max position size (% of portfolio)", suffix: "%" },
  { key: "max_sector_pct", label: "Max sector exposure", suffix: "%" },
  { key: "max_daily_loss_pct", label: "Max daily loss", suffix: "%" },
  { key: "max_drawdown_pct", label: "Max drawdown", suffix: "%" },
  { key: "default_stop_loss_pct", label: "Default stop-loss", suffix: "%" },
  { key: "default_take_profit_pct", label: "Default take-profit", suffix: "%" },
  { key: "max_leverage", label: "Max leverage", suffix: "x" },
];

export function RiskManager() {
  const [profile, setProfile] = useState<any>({
    max_position_pct: 5, max_sector_pct: 25, max_daily_loss_pct: 2,
    max_drawdown_pct: 15, default_stop_loss_pct: 5, default_take_profit_pct: 10,
    max_leverage: 1, allow_short: false, allow_options: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("risk_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setProfile({ ...profile, ...data });
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { ...profile, user_id: user.id };
    const { error } = await supabase.from("risk_profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Risk profile saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-primary" /> Risk Manager</CardTitle>
        <CardDescription>Hard limits applied to every trade — orders that exceed these are blocked.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={profile[f.key] ?? ""}
                  onChange={(e) => setProfile({ ...profile, [f.key]: parseFloat(e.target.value) || 0 })}
                />
                {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{f.suffix}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Allow short selling</Label>
            <Switch checked={profile.allow_short} onCheckedChange={(v) => setProfile({ ...profile, allow_short: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Allow options</Label>
            <Switch checked={profile.allow_options} onCheckedChange={(v) => setProfile({ ...profile, allow_options: v })} />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save Risk Profile"}</Button>
      </CardContent>
    </Card>
  );
}
