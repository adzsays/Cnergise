import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

const BAND_COLORS: Record<string, string> = {
  Conservative: "bg-emerald-600",
  Balanced: "bg-blue-600",
  Growth: "bg-amber-600",
  Aggressive: "bg-red-600",
};

export function RiskAppetite({ onAssessed }: { onAssessed?: (band: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("risk_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data);
  };
  useEffect(() => { load(); }, []);

  const assess = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("strategy-risk-assessment");
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Risk profile: ${data.band}`);
    await load();
    onAssessed?.(data.band);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" /> Risk Appetite
            </CardTitle>
            <CardDescription>Auto-assessed from your finance data — drives strategy bundle recommendations.</CardDescription>
          </div>
          <Button size="sm" onClick={assess} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" />{profile?.risk_band ? "Re-assess" : "Assess"}</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile?.risk_band ? (
          <>
            <div className="flex items-center gap-3">
              <Badge className={`${BAND_COLORS[profile.risk_band]} text-white`}>{profile.risk_band}</Badge>
              <span className="text-sm text-muted-foreground">Score: {Math.round(profile.risk_score || 0)}/100</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded border p-2"><div className="text-muted-foreground">Max position</div><div className="font-medium">{profile.max_position_pct}%</div></div>
              <div className="rounded border p-2"><div className="text-muted-foreground">Max drawdown</div><div className="font-medium">{profile.max_drawdown_pct}%</div></div>
              <div className="rounded border p-2"><div className="text-muted-foreground">Stop-loss</div><div className="font-medium">{profile.default_stop_loss_pct}%</div></div>
              <div className="rounded border p-2"><div className="text-muted-foreground">Leverage</div><div className="font-medium">{profile.max_leverage}x</div></div>
            </div>
            {profile.assessed_at && <p className="text-[11px] text-muted-foreground">Assessed {new Date(profile.assessed_at).toLocaleString()}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No risk profile yet — click Assess to compute it from your finance data.</p>
        )}
      </CardContent>
    </Card>
  );
}
