import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, Loader2, RefreshCw, Link as LinkIcon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function IBKRConnection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [show, setShow] = useState(false);
  const [conn, setConn] = useState<any>({
    nickname: "",
    gateway_url: "https://localhost:5000/v1/api",
    api_token: "",
    account_id: "",
    environment: "paper",
    demo_mode: true,
    status: "disconnected",
    last_synced_at: null,
    last_error: null,
  });

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("ibkr_connections").select("*").eq("user_id", user.id).maybeSingle();
    if (data) setConn({ ...conn, ...data });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = {
      user_id: user.id,
      nickname: conn.nickname || null,
      gateway_url: conn.gateway_url || null,
      api_token: conn.api_token || null,
      account_id: conn.account_id || null,
      environment: conn.environment || "paper",
      demo_mode: !!conn.demo_mode,
    };
    const { error } = await supabase.from("ibkr_connections").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("IBKR settings saved"); load(); }
  };

  const sync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("ibkr-sync-portfolio", { body: {} });
    setSyncing(false);
    if (error) toast.error(error.message);
    else { toast.success(`Synced ${data?.count || 0} positions (${data?.source})`); load(); }
  };

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading…</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-5 w-5 text-primary" /> Interactive Brokers
            </CardTitle>
            <CardDescription>Per-user credentials. Encrypted, locked to your account.</CardDescription>
          </div>
          <Badge variant={conn.status === "connected" ? "default" : "secondary"}>{conn.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Get your API token from IBKR Client Portal → Settings → API. Run the IBKR Client Portal Gateway locally,
            then paste its URL and your authentication token. Only you can read these values (RLS-locked).
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Demo mode</Label>
            <p className="text-xs text-muted-foreground">Use simulated data (no IBKR calls)</p>
          </div>
          <Switch checked={conn.demo_mode} onCheckedChange={(v) => setConn({ ...conn, demo_mode: v })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Nickname</Label>
            <Input value={conn.nickname || ""} onChange={(e) => setConn({ ...conn, nickname: e.target.value })} placeholder="My IBKR" />
          </div>
          <div className="space-y-2">
            <Label>Environment</Label>
            <select
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={conn.environment}
              onChange={(e) => setConn({ ...conn, environment: e.target.value })}
            >
              <option value="paper">Paper</option>
              <option value="live">Live</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gateway URL</Label>
          <Input
            value={conn.gateway_url || ""}
            onChange={(e) => setConn({ ...conn, gateway_url: e.target.value })}
            placeholder="https://localhost:5000/v1/api"
          />
        </div>

        <div className="space-y-2">
          <Label>Account ID</Label>
          <Input value={conn.account_id || ""} onChange={(e) => setConn({ ...conn, account_id: e.target.value })} placeholder="Uxxxxxxx" />
        </div>

        <div className="space-y-2">
          <Label>API Token</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={conn.api_token || ""}
              onChange={(e) => setConn({ ...conn, api_token: e.target.value })}
              placeholder="Paste your IBKR API token"
              className="pr-10"
            />
            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShow(!show)}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {conn.last_error && (
          <Alert variant="destructive"><AlertDescription className="text-xs">{conn.last_error}</AlertDescription></Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          <Button onClick={sync} variant="outline" disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Portfolio
          </Button>
          {conn.last_synced_at && (
            <span className="text-xs text-muted-foreground self-center">Last sync: {new Date(conn.last_synced_at).toLocaleString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
