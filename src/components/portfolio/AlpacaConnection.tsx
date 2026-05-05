import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, Loader2, RefreshCw, Plug, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";

export function AlpacaConnection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [show, setShow] = useState(false);
  const [conn, setConn] = useState<any>({
    nickname: "",
    api_key_id: "",
    api_secret: "",
    environment: "paper",
    base_url: "",
    demo_mode: true,
    status: "disconnected",
    last_synced_at: null,
    last_error: null,
  });

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("alpaca_connections" as any).select("*").eq("user_id", user.id).maybeSingle();
    if (data) setConn((c: any) => ({ ...c, ...(data as any) }));
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
      api_key_id: conn.api_key_id || null,
      api_secret: conn.api_secret || null,
      environment: conn.environment || "paper",
      base_url: conn.base_url || null,
      demo_mode: !!conn.demo_mode,
    };
    const { error } = await supabase.from("alpaca_connections" as any).upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Alpaca settings saved"); load(); }
  };

  const test = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("alpaca-test-connection", { body: {} });
    setTesting(false);
    if (error) { toast.error(error.message); return; }
    if (data?.ok) toast.success(`Connected ✓ Account ${data.account?.number || ""} (${data.account?.status})`);
    else toast.error(data?.error || "Connection test failed");
    load();
  };

  const sync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("alpaca-sync-portfolio", { body: {} });
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
              <Zap className="h-5 w-5 text-primary" /> Alpaca Markets
            </CardTitle>
            <CardDescription>Simple cloud broker — no local gateway needed.</CardDescription>
          </div>
          <Badge variant={conn.status === "connected" ? "default" : "secondary"}>{conn.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-1">
            <p><b>Setup in 2 minutes:</b></p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Sign up free at <a href="https://alpaca.markets/" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">alpaca.markets <ExternalLink className="h-3 w-3" /></a></li>
              <li>Open the dashboard → <b>Paper Trading</b> → <b>API Keys</b> → Generate</li>
              <li>Paste the <b>Key ID</b> and <b>Secret</b> below, keep environment on <b>Paper</b>, save → Test</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Demo mode</Label>
            <p className="text-xs text-muted-foreground">Use simulated data (no Alpaca calls)</p>
          </div>
          <Switch checked={conn.demo_mode} onCheckedChange={(v) => setConn({ ...conn, demo_mode: v })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Nickname</Label>
            <Input value={conn.nickname || ""} onChange={(e) => setConn({ ...conn, nickname: e.target.value })} placeholder="My Alpaca" />
          </div>
          <div className="space-y-2">
            <Label>Environment</Label>
            <select
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={conn.environment}
              onChange={(e) => setConn({ ...conn, environment: e.target.value })}
            >
              <option value="paper">Paper (recommended)</option>
              <option value="live">Live</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>API Key ID</Label>
          <Input value={conn.api_key_id || ""} onChange={(e) => setConn({ ...conn, api_key_id: e.target.value })} placeholder="PKxxxxxxxxxxxxxxxx" />
        </div>

        <div className="space-y-2">
          <Label>API Secret</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={conn.api_secret || ""}
              onChange={(e) => setConn({ ...conn, api_secret: e.target.value })}
              placeholder="Your API secret"
              className="pr-10"
            />
            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShow(!show)}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <details className="rounded-md border p-3">
          <summary className="text-sm cursor-pointer text-muted-foreground">Advanced: custom base URL</summary>
          <div className="space-y-2 mt-3">
            <Input
              value={conn.base_url || ""}
              onChange={(e) => setConn({ ...conn, base_url: e.target.value })}
              placeholder="Defaults to paper-api.alpaca.markets / api.alpaca.markets"
            />
          </div>
        </details>

        {conn.last_error && (
          <Alert variant="destructive"><AlertDescription className="text-xs">{conn.last_error}</AlertDescription></Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          <Button onClick={test} variant="secondary" disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>
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
