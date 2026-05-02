import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: { id: string; name: string; description?: string | null; goal_id?: string | null } | null;
  goalTitle?: string;
}

interface Suggested {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  suggested_days: number;
  order: number;
}

export function AIGenerateTasksDialog({ open, onOpenChange, project, goalTitle }: Props) {
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggested[]>([]);
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  const { bulkCreateTasks } = useTasks();

  const reset = () => {
    setSuggestions([]);
    setAccepted({});
  };

  const generate = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-tasks", {
        body: {
          project_name: project.name,
          project_description: project.description ?? "",
          goal_title: goalTitle ?? "",
          count,
        },
      });
      if (error) throw error;
      const list: Suggested[] = (data?.tasks ?? []).sort((a: any, b: any) => a.order - b.order);
      setSuggestions(list);
      // accept all by default
      const acc: Record<number, boolean> = {};
      list.forEach((_, i) => (acc[i] = true));
      setAccepted(acc);
    } catch (e: any) {
      toast.error("AI generation failed", { description: e?.message ?? "Try again" });
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    if (!project) return;
    const today = new Date();
    const chosen = suggestions
      .map((s, i) => ({ s, i }))
      .filter(({ i }) => accepted[i])
      .map(({ s }) => {
        const start = new Date(today);
        const end = new Date(today);
        end.setDate(end.getDate() + Math.max(1, Math.round(s.suggested_days)));
        return {
          title: s.title,
          description: s.description ?? null,
          priority: s.priority,
          status: "todo" as const,
          project_id: project.id,
          start_date: start.toISOString().split("T")[0],
          end_date: end.toISOString().split("T")[0],
          due_date: end.toISOString().split("T")[0],
          completion_percent: 0,
        };
      });

    if (chosen.length === 0) {
      toast.info("Select at least one task");
      return;
    }

    try {
      await bulkCreateTasks.mutateAsync(chosen as any);
      toast.success(`Added ${chosen.length} tasks to "${project.name}"`);
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error("Failed to add tasks", { description: e?.message });
    }
  };

  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Task Plan {project ? `· ${project.name}` : ""}
          </DialogTitle>
          <DialogDescription>
            Generate a detailed task breakdown for this project. Review and accept the ones you want to add.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3 pb-2 border-b">
          <div className="space-y-1">
            <Label htmlFor="count" className="text-xs">How many tasks</Label>
            <Input
              id="count"
              type="number"
              min={3}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.max(3, Math.min(20, Number(e.target.value) || 8)))}
              className="h-9 w-24"
            />
          </div>
          <Button onClick={generate} disabled={loading || !project} size="sm">
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {suggestions.length ? "Regenerate" : "Generate"}
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {suggestions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              {loading ? "Drafting tasks…" : "Click Generate to draft a task plan."}
            </div>
          ) : (
            <div className="space-y-2 py-3">
              {suggestions.map((s, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40 cursor-pointer"
                >
                  <Checkbox
                    checked={!!accepted[i]}
                    onCheckedChange={(v) => setAccepted((prev) => ({ ...prev, [i]: !!v }))}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{s.title}</span>
                      <Badge variant="outline" className="text-[10px]">{s.priority}</Badge>
                      <Badge variant="outline" className="text-[10px]">~{s.suggested_days}d</Badge>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={accept} disabled={acceptedCount === 0 || bulkCreateTasks.isPending}>
            Add {acceptedCount} task{acceptedCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
