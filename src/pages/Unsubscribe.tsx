import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "validating" | "valid" | "invalid" | "already" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("validating");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMsg("Missing unsubscribe token.");
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        const data = await r.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else { setState("invalid"); setMsg(data.error ?? "Invalid token."); }
      } catch (e: any) {
        setState("error");
        setMsg(e.message);
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if (data?.success || data?.reason === "already_unsubscribed") setState("done");
      else { setState("error"); setMsg(data?.error ?? "Failed."); }
    } catch (e: any) {
      setState("error");
      setMsg(e.message);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-6 sm:p-8 text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        {state === "validating" && (
          <><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">Checking your unsubscribe link…</p></>
        )}
        {state === "valid" && (
          <>
            <h1 className="text-xl font-semibold">Unsubscribe from Cnergise emails?</h1>
            <p className="text-sm text-muted-foreground">You'll stop receiving reminder and notification emails. You can re-enable anytime in your profile.</p>
            <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
          </>
        )}
        {state === "submitting" && (
          <><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /><p className="text-sm">Processing…</p></>
        )}
        {state === "done" && (
          <><CheckCircle2 className="h-10 w-10 mx-auto text-primary" /><h1 className="text-xl font-semibold">You're unsubscribed</h1><p className="text-sm text-muted-foreground">We won't send you any more emails to this address.</p></>
        )}
        {state === "already" && (
          <><CheckCircle2 className="h-10 w-10 mx-auto text-primary" /><h1 className="text-xl font-semibold">Already unsubscribed</h1><p className="text-sm text-muted-foreground">This email is already on the suppression list.</p></>
        )}
        {(state === "invalid" || state === "error") && (
          <><XCircle className="h-10 w-10 mx-auto text-destructive" /><h1 className="text-xl font-semibold">Couldn't process</h1><p className="text-sm text-muted-foreground">{msg || "Invalid or expired link."}</p></>
        )}
      </Card>
    </div>
  );
}
