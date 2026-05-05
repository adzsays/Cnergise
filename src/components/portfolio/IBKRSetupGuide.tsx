import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function IBKRSetupGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connect IBKR the right way</CardTitle>
        <CardDescription>
          Cloud servers can't reach <code>localhost</code>. To make IBKR work from phone + laptop, expose
          your local Client Portal Gateway via a public HTTPS tunnel — then paste that URL above.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="cf">
          <AccordionItem value="cf">
            <AccordionTrigger>
              Recommended: Cloudflare Tunnel <Badge variant="secondary" className="ml-2">free, persistent</Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Install <code>cloudflared</code> on the machine running the IBKR Gateway.</li>
                <li>Run: <code>cloudflared tunnel --url https://localhost:5000 --no-tls-verify</code></li>
                <li>Copy the printed <code>https://&lt;random&gt;.trycloudflare.com</code> URL.</li>
                <li>Paste it above as the Gateway URL, appending <code>/v1/api</code>.</li>
                <li>Open the same URL in a browser and complete IBKR login once.</li>
                <li>Click <b>Test Connection</b>.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ngrok">
            <AccordionTrigger>Quick test: ngrok</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Install ngrok and authenticate.</li>
                <li>Run: <code>ngrok http https://localhost:5000</code></li>
                <li>Use the <code>https://*.ngrok-free.app</code> URL + <code>/v1/api</code>.</li>
                <li>Log in via that URL in a browser, then Test Connection.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="vps">
            <AccordionTrigger>Always-on: VPS / Raspberry Pi</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              Run the IBKR Client Portal Gateway on a small always-on box with a real domain + Let's Encrypt
              cert. This survives laptop sleep and works 24/7 from any device.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="other">
            <AccordionTrigger>Don't want to host anything?</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              Keep <b>Demo mode</b> ON — the app uses simulated holdings everywhere. When you're ready,
              we can also wire a cloud-native broker (Alpaca for US stocks/crypto, or a crypto exchange
              like Coinbase/Kraken) which uses plain API keys with no local gateway.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
