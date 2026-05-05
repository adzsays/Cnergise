import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  enabled: boolean;
  trigger_mentions: boolean;
  trigger_vip: boolean;
  trigger_action_required: boolean;
  trigger_keywords: boolean;
  vip_handles: string[];
  source_email: boolean;
  source_messaging: boolean;
  source_social: boolean;
  prompt_floating: boolean;
  prompt_push: boolean;
  prompt_digest: boolean;
  digest_hour: number;
  min_score: number;
}

const DEFAULTS: Settings = {
  enabled: true,
  trigger_mentions: true,
  trigger_vip: true,
  trigger_action_required: true,
  trigger_keywords: true,
  vip_handles: [],
  source_email: true,
  source_messaging: true,
  source_social: true,
  prompt_floating: true,
  prompt_push: true,
  prompt_digest: true,
  digest_hour: 8,
  min_score: 75,
};

export const ListeningAgentSettings = () => {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [vipText, setVipText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("listening_agent_settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (data) {
        setS({ ...DEFAULTS, ...data });
        setVipText((data.vip_handles ?? []).join(", "));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const payload = {
      ...s,
      user_id: u.user.id,
      vip_handles: vipText.split(",").map((x) => x.trim()).filter(Boolean),
    };
    const { error } = await supabase
      .from("listening_agent_settings")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    toast({
      title: error ? "Save failed" : "Settings saved",
      description: error?.message,
      variant: error ? "destructive" : "default",
    });
  };

  const runScan = async () => {
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("listening-agent-scan", {
      body: {},
    });
    setScanning(false);
    if (error) {
      toast({ title: "Scan failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Scan complete",
        description: `Surfaced ${data?.scored ?? 0} of ${data?.total ?? 0} items.`,
      });
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Listening Agent
        </CardTitle>
        <CardDescription>
          Silently watches your email and social channels. Only prompts you when something matters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="text-sm font-medium">Agent enabled</Label>
            <p className="text-xs text-muted-foreground">Master switch for the listener.</p>
          </div>
          <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
        </div>

        <div>
          <Label className="text-sm font-medium">Triggers</Label>
          <p className="mb-2 text-xs text-muted-foreground">What should wake the agent?</p>
          {[
            { k: "trigger_mentions" as const, label: "Direct mentions / DMs to me" },
            { k: "trigger_vip" as const, label: "VIP senders" },
            { k: "trigger_action_required" as const, label: "Action required (reply, decision, deadline)" },
            { k: "trigger_keywords" as const, label: "My tracked keywords / brands / people" },
          ].map((t) => (
            <div key={t.k} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{t.label}</span>
              <Switch checked={s[t.k]} onCheckedChange={(v) => setS({ ...s, [t.k]: v })} />
            </div>
          ))}
        </div>

        <div>
          <Label className="text-sm font-medium">VIP senders</Label>
          <p className="mb-2 text-xs text-muted-foreground">Comma-separated names, emails, or @handles.</p>
          <Input value={vipText} onChange={(e) => setVipText(e.target.value)} placeholder="alex@acme.com, @ceo" />
        </div>

        <div>
          <Label className="text-sm font-medium">Sources</Label>
          <p className="mb-2 text-xs text-muted-foreground">Where should the agent listen?</p>
          {[
            { k: "source_email" as const, label: "Email (Gmail / Outlook)" },
            { k: "source_messaging" as const, label: "Messaging (WhatsApp / Telegram)" },
            { k: "source_social" as const, label: "Social feeds & news mentions" },
          ].map((t) => (
            <div key={t.k} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{t.label}</span>
              <Switch checked={s[t.k]} onCheckedChange={(v) => setS({ ...s, [t.k]: v })} />
            </div>
          ))}
        </div>

        <div>
          <Label className="text-sm font-medium">How to prompt me</Label>
          <p className="mb-2 text-xs text-muted-foreground">All silent unless an item beats the threshold.</p>
          {[
            { k: "prompt_floating" as const, label: "Floating bubble in-app" },
            { k: "prompt_push" as const, label: "Push notification (only urgent)" },
            { k: "prompt_digest" as const, label: "Daily digest" },
          ].map((t) => (
            <div key={t.k} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{t.label}</span>
              <Switch checked={s[t.k]} onCheckedChange={(v) => setS({ ...s, [t.k]: v })} />
            </div>
          ))}
          {s.prompt_digest && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Digest hour</span>
              <Input
                type="number"
                min={0}
                max={23}
                className="w-20"
                value={s.digest_hour}
                onChange={(e) => setS({ ...s, digest_hour: Number(e.target.value) })}
              />
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium">Sensitivity (min score {s.min_score})</Label>
          <p className="mb-2 text-xs text-muted-foreground">Higher = quieter. 75 is a good default.</p>
          <Slider
            value={[s.min_score]}
            min={50}
            max={95}
            step={5}
            onValueChange={(v) => setS({ ...s, min_score: v[0] })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Save settings
          </Button>
          <Button variant="outline" onClick={runScan} disabled={scanning}>
            {scanning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            Run scan now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListeningAgentSettings;
