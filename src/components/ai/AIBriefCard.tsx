import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, Send, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Scope = "today" | "finance" | "plan" | "health";

interface Brief {
  id: string;
  scope: Scope;
  headline: string;
  body: string;
  actions: { label: string; reason: string; related_kind?: string; related_id?: string }[];
  confidence: number;
  generated_for_date: string;
}

interface OpenQuestion {
  id: string;
  question: string;
  brief_id: string | null;
}

export function AIBriefCard({ scope, title }: { scope: Scope; title?: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");

  // Do NOT auto-fetch — only load cached briefs (no AI call). User must click Generate/Refresh.
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ai-brief", scope, "cached-only"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: rows } = await supabase
        .from("ai_briefs")
        .select("*")
        .eq("scope", scope)
        .eq("generated_for_date", today)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(1);
      const brief = (rows?.[0] ?? null) as unknown as Brief | null;
      return { brief, cached: true } as { brief: Brief | null; cached: boolean };
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const { data: openQ } = useQuery({
    queryKey: ["ai-brief-question", data?.brief?.id],
    enabled: !!data?.brief?.id,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("ai_brief_questions")
        .select("id, question, brief_id")
        .eq("brief_id", data!.brief.id)
        .is("answered_at", null)
        .limit(1);
      return (rows?.[0] ?? null) as OpenQuestion | null;
    },
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-insights", { body: { scope, force: true } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-brief", scope] });
      toast({ title: "Brief refreshed" });
    },
    onError: (e: any) => toast({ title: "Couldn't refresh", description: e.message, variant: "destructive" }),
  });

  const answerQuestion = useMutation({
    mutationFn: async () => {
      if (!openQ || !answer.trim()) return;
      const { error } = await supabase
        .from("ai_brief_questions")
        .update({ answer: answer.trim(), answered_at: new Date().toISOString() })
        .eq("id", openQ.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setAnswer("");
      qc.invalidateQueries({ queryKey: ["ai-brief-question"] });
      toast({ title: "Thanks — I'll factor that in next time." });
    },
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      if (!data?.brief?.id) return;
      await supabase.from("ai_briefs").update({ dismissed_at: new Date().toISOString() }).eq("id", data.brief.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-brief", scope] }),
  });

  if (isLoading) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Generating your AI brief…
        </div>
      </Card>
    );
  }

  const brief = data?.brief;
  if (!brief) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>{title ?? "AI brief"} not available yet.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-primary/[0.03] via-card to-card border-primary/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title ?? "AI brief"}</p>
            <h3 className="text-sm sm:text-base font-semibold leading-tight truncate">{brief.headline}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px] h-5">{Math.round(brief.confidence * 100)}%</Badge>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => regenerate.mutate()} disabled={regenerate.isPending || isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${regenerate.isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dismiss.mutate()}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{brief.body}</p>

      {brief.actions?.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {brief.actions.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium leading-tight">{a.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{a.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {openQ && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <p className="text-xs font-medium text-foreground">{openQ.question}</p>
          <div className="flex gap-2">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer…"
              rows={1}
              className="text-sm min-h-[36px] resize-none"
            />
            <Button size="sm" onClick={() => answerQuestion.mutate()} disabled={!answer.trim() || answerQuestion.isPending}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
