import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, Loader2, RefreshCw, Link as LinkIcon, HelpCircle, Plug } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IBKRSetupGuide } from "./IBKRSetupGuide";

export function IBKRConnection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
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

  const test = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("ibkr-test-connection", { body: {} });
    setTesting(false);
    if (error) { toast.error(error.message); return; }
    if (data?.ok && data?.authenticated) toast.success("Gateway reachable & authenticated ✓");
    else if (data?.ok) toast.warning(data.message || "Reachable, but not logged in to IBKR yet");
    else toast.error(data?.error || "Connection test failed");
    load();
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
            <b>You don't need an API token.</b> IBKR's Client Portal Gateway uses a browser session, not a token.
            Just paste your public Gateway URL + Account ID, then log in to that URL once in your browser.
            Static API tokens only exist for institutional OAuth 1.0a (requires IBKR approval) — leave it blank.
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
          <div className="flex items-center gap-1.5">
            <Label>Gateway URL</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-3.5 w-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p className="font-medium mb-1">Where do I get this?</p>
                  <p>The IBKR Client Portal Gateway runs on a machine you control. It bridges this app to IBKR.</p>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    <li><b>Local only</b> (laptop): use <code>https://localhost:5000/v1/api</code> — only works on that device.</li>
                    <li><b>Phone + laptop</b>: host the gateway on a small VPS/Pi with HTTPS and put that public URL here.</li>
                    <li><b>No setup</b>: keep Demo mode ON to use simulated data on every device.</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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

        <details className="rounded-md border p-3">
          <summary className="text-sm cursor-pointer text-muted-foreground">Advanced: API Token (institutional OAuth only — leave blank)</summary>
          <div className="space-y-2 mt-3">
            <Label className="text-xs">API Token</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={conn.api_token || ""}
                onChange={(e) => setConn({ ...conn, api_token: e.target.value })}
                placeholder="Leave blank unless IBKR issued you an OAuth token"
                className="pr-10"
              />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
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

      <div className="px-6 pb-6">
        <IBKRSetupGuide />
      </div>
    </Card>
  );
}
