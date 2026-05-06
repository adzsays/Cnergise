import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Rule = {
  id: string;
  match_type: string;
  match_value: string;
  cashflow_id: string | null;
  cost_centre: string | null;
  priority: number;
  times_applied: number;
  last_applied_at: string | null;
};

export function MappingRulesDialog({
  open,
  onOpenChange,
  cashflowOptions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cashflowOptions: { id: string; label: string }[];
}) {
  const qc = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["cashflow_mapping_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashflow_mapping_rules" as any)
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Rule[];
    },
    enabled: open,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cashflow_mapping_rules" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashflow_mapping_rules"] });
      toast.success("Rule deleted");
    },
  });

  const labelFor = (id: string | null) =>
    id ? cashflowOptions.find((c) => c.id === id)?.label || "—" : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mapping Rules</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          Rules learned from your corrections. New transactions matching a rule are auto-mapped without using AI.
        </div>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading…</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No rules yet. Edit a transaction's Budget Line and choose "Apply to all" to create one.
            </div>
          ) : (
            rules.map((r) => (
              <div key={r.id} className="border rounded-md p-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    “{r.match_value}” <span className="text-xs text-muted-foreground">({r.match_type})</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">→ {labelFor(r.cashflow_id)}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">applied {r.times_applied}×</Badge>
                    {r.cost_centre && <Badge variant="secondary" className="text-[10px]">{r.cost_centre}</Badge>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
