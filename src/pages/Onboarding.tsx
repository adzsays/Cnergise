import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppFeatures, useMyAgreement, useEnableFeature, useSignAgreement, type AppFeature } from "@/hooks/useFeatures";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ShieldAlert, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const { data: features = [], isLoading } = useAppFeatures();
  const { data: agreement } = useMyAgreement();
  const enable = useEnableFeature();
  const sign = useSignAgreement();

  const [step, setStep] = useState(1); // 1: pick, 2: disclaimers, 3: sign
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acceptedDisclaimers, setAcceptedDisclaimers] = useState<Set<string>>(new Set());
  const [agreedFinal, setAgreedFinal] = useState(false);

  // Pre-select core features so they appear in the agreement
  useEffect(() => {
    if (features.length && selected.size === 0) {
      const coreKeys = features.filter((f) => f.is_core).map((f) => f.key);
      setSelected(new Set(coreKeys));
    }
  }, [features, selected.size]);

  // If already onboarded, redirect
  useEffect(() => {
    if (agreement) navigate("/home", { replace: true });
  }, [agreement, navigate]);

  const optional = features.filter((f) => !f.is_core);
  const core = features.filter((f) => f.is_core);
  const selectedFeatures = useMemo(
    () => features.filter((f) => selected.has(f.key)),
    [features, selected],
  );
  const regulatedSelected = selectedFeatures.filter((f) => f.is_regulated);
  const needsDisclaimerAcceptance = selectedFeatures.filter((f) => f.disclaimer);

  const toggle = (key: string) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  };

  const toggleDisclaimer = (key: string) => {
    const next = new Set(acceptedDisclaimers);
    next.has(key) ? next.delete(key) : next.add(key);
    setAcceptedDisclaimers(next);
  };

  const allDisclaimersAccepted = needsDisclaimerAcceptance.every((f) => acceptedDisclaimers.has(f.key));

  const handleFinish = async () => {
    try {
      // 1) Create subscriptions for every selected non-core feature
      for (const f of selectedFeatures.filter((x) => !x.is_core)) {
        await enable.mutateAsync({ feature: f });
      }
      // 2) Sign master agreement
      await sign.mutateAsync({ selectedFeatures: Array.from(selected) });
      toast.success("Welcome to Cnergise — your account is ready.");
      navigate("/home", { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Onboarding failed");
    }
  };

  if (isLoading) {
    return <div className="min-h-[100dvh] grid place-items-center">Loading...</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-background to-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <Sparkles className="h-4 w-4" /> Set up your workspace
          </div>
          <h1 className="text-3xl font-bold">Build Cnergise your way</h1>
          <p className="text-muted-foreground">Pick the modules you want. Add or remove them anytime.</p>
        </div>

        <Progress value={(step / 3) * 100} className="h-1" />

        {step === 1 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="font-semibold">Always included</h2>
              <p className="text-sm text-muted-foreground">Core productivity features for everyone.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {core.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 p-3 rounded-md border bg-muted/40">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold">Optional add-ons</h2>
              <p className="text-sm text-muted-foreground">Select the modules you want. Regulated features need admin approval.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {optional.map((f) => (
                  <label key={f.key} className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/40 cursor-pointer transition">
                    <Checkbox checked={selected.has(f.key)} onCheckedChange={() => toggle(f.key)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{f.name}</span>
                        {f.is_regulated && (
                          <Badge variant="outline" className="text-xs gap-1 border-amber-400 text-amber-700 dark:text-amber-400">
                            <ShieldAlert className="h-3 w-3" /> Regulated
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(needsDisclaimerAcceptance.length ? 2 : 3)}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Compliance disclaimers</h2>
              <p className="text-sm text-muted-foreground">Please read and accept the terms for each selected feature.</p>
            </div>
            <ScrollArea className="max-h-[55vh] pr-3">
              <div className="space-y-3">
                {needsDisclaimerAcceptance.map((f) => (
                  <div key={f.key} className={`rounded-md border p-3 ${f.is_regulated ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20" : "bg-muted/30"}`}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-sm">{f.name}</span>
                      <Badge variant="outline" className="text-[10px]">v{f.current_terms_version}</Badge>
                      {f.is_regulated && <Badge className="text-[10px] bg-amber-500 hover:bg-amber-600">Regulated</Badge>}
                    </div>
                    <p className="text-xs whitespace-pre-line leading-relaxed text-muted-foreground">{f.disclaimer}</p>
                    <label className="flex items-start gap-2 mt-3 cursor-pointer">
                      <Checkbox checked={acceptedDisclaimers.has(f.key)} onCheckedChange={() => toggleDisclaimer(f.key)} className="mt-0.5" />
                      <span className="text-xs">I have read and agree to the {f.name} terms (v{f.current_terms_version}).</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {!allDisclaimersAccepted && (
              <div className="rounded-md border border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                {needsDisclaimerAcceptance.filter((f) => !acceptedDisclaimers.has(f.key)).length} disclaimer(s) still need acceptance:
                <span className="font-medium"> {needsDisclaimerAcceptance.filter((f) => !acceptedDisclaimers.has(f.key)).map((f) => f.name).join(", ")}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-2">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAcceptedDisclaimers(new Set(needsDisclaimerAcceptance.map((f) => f.key)))}
                  disabled={allDisclaimersAccepted}
                >
                  Accept all
                </Button>
                <Button onClick={() => setStep(3)} disabled={!allDisclaimersAccepted}>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Sign your service agreement</h2>
              <p className="text-sm text-muted-foreground">A signed copy will be saved to your profile and emailed to you.</p>
            </div>

            <div className="rounded-md border p-4 bg-muted/30 text-sm space-y-3">
              <p><strong>Cnergise Master Service Agreement v1.0.0</strong></p>
              <p>
                By signing below, you confirm your selection of the following modules and accept the associated terms,
                disclaimers and limitations of liability described in the previous step. You acknowledge that
                Cnergise is not a regulated financial adviser, accountant, healthcare provider, or broker, and that
                any regulated module is subject to admin approval and may be revoked at any time.
              </p>
              <div>
                <p className="font-medium mb-1">Selected modules ({selectedFeatures.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFeatures.map((f) => (
                    <Badge key={f.key} variant={f.is_regulated ? "default" : "secondary"} className="text-[10px]">
                      {f.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {regulatedSelected.length > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Note: {regulatedSelected.length} regulated feature(s) will remain pending until approved by an admin.
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox checked={agreedFinal} onCheckedChange={(v) => setAgreedFinal(!!v)} className="mt-0.5" />
              <span className="text-sm">
                I, the account holder, accept this agreement. I understand my IP address, browser and a cryptographic signature
                of my consent will be recorded as proof.
              </span>
            </label>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(needsDisclaimerAcceptance.length ? 2 : 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleFinish} disabled={!agreedFinal || enable.isPending || sign.isPending}>
                {sign.isPending || enable.isPending ? "Finalizing..." : "Sign & Continue"}
              </Button>
            </div>
          </Card>
        )}

        <div className="text-center">
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
