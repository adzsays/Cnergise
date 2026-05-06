import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { fmtMoney } from "@/hooks/useInvoicing";

export type EnrichmentProposal = {
  txn_id: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  posted_on: string;
  cashflow_id: string | null;
  new_cashflow?: { type: "income" | "expense"; category: string; subcategory: string; cost_centre: string | null };
  classification: string;
  reason: string;
  source: "transfer" | "keyword" | "ai-web" | "ai";
  confidence: number;
  rule?: { match_type: string; match_value: string };
  paired_txn_id?: string;
};

export type EnrichmentSummary = {
  total: number;
  proposed: number;
  transfers: number;
  keyword: number;
  ai: number;
  unhandled: number;
  new_cashflow_lines: { type: string; category: string; subcategory: string; count: number }[];
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  proposals: EnrichmentProposal[];
  summary: EnrichmentSummary | null;
  onApply: (selected: EnrichmentProposal[], createRules: boolean) => Promise<void>;
  applying: boolean;
}

const sourceColor: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  transfer: "default",
  keyword: "secondary",
  "ai-web": "outline",
  ai: "outline",
};

export function EnrichmentReviewDialog({ open, onOpenChange, proposals, summary, onApply, applying }: Props) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [createRules, setCreateRules] = useState(true);

  const toggle = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selected = proposals.filter((p) => !excluded.has(p.txn_id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Deep enrichment review
          </DialogTitle>
          <DialogDescription>
            Review proposed classifications. Anything you keep checked will be applied and (optionally) saved as a reusable rule for future bank imports.
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <Stat label="Unmapped scanned" value={summary.total} />
            <Stat label="Proposed" value={summary.proposed} />
            <Stat label="Transfers" value={summary.transfers} />
            <Stat label="Keyword" value={summary.keyword} />
            <Stat label="AI / Web" value={summary.ai} />
          </div>
        )}

        {summary && summary.new_cashflow_lines.length > 0 && (
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="text-xs font-medium mb-2 flex items-center gap-1">
              <Plus className="h-3 w-3" /> New budget / cash-flow lines to be created
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summary.new_cashflow_lines.map((l, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">
                  {l.type === "income" ? "+" : "−"} {l.category} / {l.subcategory} · {l.count}×
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-1.5">
            {proposals.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-6">
                Nothing to enrich — every transaction is already mapped or could not be classified.
              </div>
            )}
            {proposals.map((p) => {
              const isExcluded = excluded.has(p.txn_id);
              return (
                <div
                  key={p.txn_id}
                  className={`flex items-start gap-2 rounded border p-2 text-xs ${isExcluded ? "opacity-50" : ""}`}
                >
                  <Checkbox
                    checked={!isExcluded}
                    onCheckedChange={() => toggle(p.txn_id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{p.merchant || p.description || "—"}</span>
                      <Badge variant={sourceColor[p.source]} className="text-[9px] capitalize h-4 px-1">
                        {p.source}
                      </Badge>
                      {p.new_cashflow && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">new line</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{p.posted_on}</span>
                      <span className={`text-xs tabular-nums font-semibold ${p.amount < 0 ? "text-destructive" : "text-green-600"}`}>
                        {fmtMoney(p.amount, "GBP")}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      → <span className="font-medium text-foreground">{p.classification}</span>
                      <span className="ml-2">· {p.reason}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <label className="flex items-center gap-2 text-xs mr-auto">
            <Checkbox checked={createRules} onCheckedChange={(v) => setCreateRules(!!v)} />
            Save as reusable rules for future imports
          </label>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>Cancel</Button>
          <Button onClick={() => onApply(selected, createRules)} disabled={applying || selected.length === 0}>
            {applying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Apply {selected.length} {selected.length === 1 ? "mapping" : "mappings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
