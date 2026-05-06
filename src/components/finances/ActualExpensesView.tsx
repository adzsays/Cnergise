import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, Link2, Loader2, Trash2, Search, Sparkles, Settings2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { fmtMoney } from "@/hooks/useInvoicing";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { MappingRulesDialog } from "./MappingRulesDialog";
import { EnrichmentReviewDialog, type EnrichmentProposal, type EnrichmentSummary } from "./EnrichmentReviewDialog";

type ActualExpense = {
  id: string;
  posted_on: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  currency: string;
  category: string | null;
  sub_type: string | null;
  notes: string | null;
  account_provider: string | null;
  account_name: string | null;
  status: string | null;
  source: string;
  external_id: string | null;
  mapped_cashflow_id: string | null;
  mapping_source: string | null;
  mapping_confidence: number | null;
  cost_centre: string | null;
};

const excelDateToISO = (v: any): string => {
  if (v == null || v === "") return new Date().toISOString().slice(0, 10);
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
};

const num = (v: any): number => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const sourceBadgeVariant = (s: string | null) =>
  s === "rule" ? "default" : s === "manual" ? "secondary" : s === "ai" ? "outline" : "outline";

export function ActualExpensesView() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [applyingEnrich, setApplyingEnrich] = useState(false);
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [enrichProposals, setEnrichProposals] = useState<EnrichmentProposal[]>([]);
  const [enrichSummary, setEnrichSummary] = useState<EnrichmentSummary | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { getSetting } = useSystemSettings();
  const { transactions } = useFinancialData() as any;

  // Pending change for the bulk-apply prompt
  const [pendingChange, setPendingChange] = useState<{
    expense: ActualExpense;
    cashflow_id: string;
    cashflow_label: string;
    similar_count: number;
  } | null>(null);

  const cashflowOptions = useMemo(() => {
    return (transactions || []).map((t: any) => ({
      id: t.id,
      label: `${t.type === "income" ? "+" : "−"} ${t.subcategory || t.category} (${t.cost_centre || "—"})`,
      cost_centre: t.cost_centre,
    }));
  }, [transactions]);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["actual_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actual_expenses" as any)
        .select("*")
        .order("posted_on", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as ActualExpense[];
    },
  });

  const bulkInsert = useMutation({
    mutationFn: async (rows: any[]) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not signed in");
      const payload = rows.map((r) => ({ ...r, user_id: user.id }));
      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500);
        const { error } = await supabase
          .from("actual_expenses" as any)
          .upsert(chunk, { onConflict: "user_id,source,external_id", ignoreDuplicates: true });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["actual_expenses"] });
      toast.success(`Imported ${vars.length} transactions`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Import failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("actual_expenses" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actual_expenses"] }),
  });

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
      if (rows.length === 0) throw new Error("Empty sheet");
      const parsed = rows.map((r) => {
        const dateRaw = r["Date"] ?? r["date"] ?? r["Posted"] ?? r["posted_on"];
        const posted_on = excelDateToISO(dateRaw);
        const amount = num(r["Amount"] ?? r["amount"] ?? r["Value"]);
        const merchant = r["Merchant Name"] ?? r["Merchant"] ?? r["Payee"] ?? null;
        const description = r["Description"] ?? r["Narrative"] ?? r["Details"] ?? null;
        const ext = `${posted_on}|${amount}|${(description ?? merchant ?? "").toString().slice(0, 80)}`;
        return {
          posted_on, amount,
          currency: r["Currency"] ?? "GBP",
          merchant, description,
          category: r["Category"] ?? null,
          sub_type: r["Sub Type"] ?? r["SubType"] ?? null,
          notes: r["Notes"] ?? null,
          account_provider: r["Account Provider"] ?? null,
          account_name: r["Account Name"] ?? null,
          status: r["Status"] ?? null,
          source: "excel",
          external_id: ext,
          raw: r,
        };
      });
      await bulkInsert.mutateAsync(parsed);
      // Do not auto-run AI classify after import — user must click "Auto-classify".
      toast.message("Import complete. Click 'Auto-classify' to run AI mapping.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to import");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const runClassify = async (silent = false) => {
    setClassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("classify-transactions", {
        body: { onlyUnmapped: true },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["actual_expenses"] });
      if (!silent) {
        toast.success(`Auto-mapped ${data?.matched ?? 0} via rules, ${data?.ai_classified ?? 0} via AI`);
      } else if ((data?.matched ?? 0) + (data?.ai_classified ?? 0) > 0) {
        toast.message(`Auto-classified ${(data?.matched ?? 0) + (data?.ai_classified ?? 0)} transactions`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Classification failed");
    } finally {
      setClassifying(false);
    }
  };

  const runEnrich = async () => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-transactions", { body: {} });
      if (error) throw error;
      setEnrichProposals(data?.proposals || []);
      setEnrichSummary(data?.summary || null);
      setEnrichOpen(true);
      if ((data?.proposals?.length ?? 0) === 0) {
        toast.message("Nothing left to enrich");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  const applyEnrichment = async (selected: EnrichmentProposal[], createRules: boolean) => {
    setApplyingEnrich(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-enrichment-summary", {
        body: { proposals: selected, createRules },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["actual_expenses"] });
      toast.success(
        `Applied ${data?.applied ?? 0} mappings · ${data?.rules_created ?? 0} new rules · ${data?.new_cashflow_lines ?? 0} new budget lines`
      );
      setEnrichOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to apply");
    } finally {
      setApplyingEnrich(false);
    }
  };

  const finexerConfigured = !!getSetting("finexer_api_key");

  const handleFinexerSync = async () => {
    if (!finexerConfigured) {
      toast.error("Configure Finexer API key in Settings → Finexer first");
      return;
    }
    setSyncing(true);
    try {
      toast.info("Finexer sync will be available once the connector is enabled.");
    } finally {
      setSyncing(false);
    }
  };

  // Compute "similar" count for the bulk-apply prompt by matching merchant text
  const onChangeMapping = (e: ActualExpense, newCashflowId: string) => {
    if (newCashflowId === "__none__") {
      // single update, clear mapping
      supabase
        .from("actual_expenses" as any)
        .update({ mapped_cashflow_id: null, mapping_source: null, mapping_confidence: null })
        .eq("id", e.id)
        .then(() => qc.invalidateQueries({ queryKey: ["actual_expenses"] }));
      return;
    }
    const matchKey = (e.merchant || e.description || "").trim();
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
    const target = norm(matchKey);
    const similar_count = expenses.filter((x) =>
      x.id !== e.id && norm(`${x.merchant ?? ""} ${x.description ?? ""}`).includes(target)
    ).length;
    const cf = cashflowOptions.find((c: any) => c.id === newCashflowId);
    setPendingChange({
      expense: e,
      cashflow_id: newCashflowId,
      cashflow_label: cf?.label || "—",
      similar_count,
    });
  };

  const confirmMapping = async (applyToSimilar: boolean) => {
    if (!pendingChange) return;
    const { expense, cashflow_id } = pendingChange;
    const cf = cashflowOptions.find((c: any) => c.id === cashflow_id);
    const matchValue = (expense.merchant || expense.description || "").trim();
    try {
      const { data, error } = await supabase.functions.invoke("apply-mapping-rule", {
        body: {
          transaction_id: expense.id,
          cashflow_id,
          cost_centre: cf?.cost_centre ?? null,
          apply_to_similar: applyToSimilar,
          match_value: matchValue,
          match_type: "description_contains",
        },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["actual_expenses"] });
      if (applyToSimilar) {
        toast.success(`Updated ${data?.bulk_count ?? 1} transactions and saved a rule`);
      } else {
        toast.success("Updated transaction");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to apply mapping");
    } finally {
      setPendingChange(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) =>
      [e.merchant, e.description, e.category, e.account_provider, e.account_name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [expenses, search]);

  const totals = useMemo(() => {
    const inflow = filtered.filter((e) => e.amount > 0).reduce((s, e) => s + Number(e.amount), 0);
    const outflow = filtered.filter((e) => e.amount < 0).reduce((s, e) => s + Number(e.amount), 0);
    const mapped = filtered.filter((e) => e.mapped_cashflow_id).length;
    return { inflow, outflow, net: inflow + outflow, mapped, unmapped: filtered.length - mapped };
  }, [filtered]);

  const cashflowLabel = (id: string | null) =>
    id ? cashflowOptions.find((c: any) => c.id === id)?.label || "—" : "—";

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h3 className="font-semibold">Bank Account Transactions</h3>
            <p className="text-sm text-muted-foreground">
              Upload a bank export, then let rules + AI classify each line against your Cash Flow budget.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Upload
            </Button>
            <Button variant="secondary" onClick={handleFinexerSync} disabled={syncing}>
              <Link2 className="h-4 w-4 mr-1" /> Finexer
            </Button>
            <Button onClick={() => runClassify(false)} disabled={classifying}>
              {classifying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Auto-classify
            </Button>
            <Button variant="secondary" onClick={runEnrich} disabled={enriching}>
              {enriching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              Deep enrich
            </Button>
            <Button variant="outline" onClick={() => setRulesOpen(true)}>
              <Settings2 className="h-4 w-4 mr-1" /> Rules
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Inflow</div>
          <div className="text-xl font-semibold tabular-nums">{fmtMoney(totals.inflow, "GBP")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Outflow</div>
          <div className="text-xl font-semibold tabular-nums">{fmtMoney(totals.outflow, "GBP")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Net</div>
          <div className="text-xl font-semibold tabular-nums">{fmtMoney(totals.net, "GBP")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Mapped</div>
          <div className="text-xl font-semibold tabular-nums">
            {totals.mapped}<span className="text-sm text-muted-foreground"> / {filtered.length}</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-3 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchant, description, category, account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 max-w-md"
          />
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} of {expenses.length}</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No transactions yet. Upload your bank statement to get started.
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {filtered.slice(0, 200).map((e) => (
                <div key={e.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{e.merchant || e.description || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.description}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{e.posted_on}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-semibold tabular-nums ${e.amount < 0 ? "text-destructive" : "text-green-600"}`}>
                        {fmtMoney(e.amount, e.currency)}
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 mt-1" onClick={() => remove.mutate(e.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={e.mapped_cashflow_id ?? "__none__"}
                      onValueChange={(v) => onChangeMapping(e, v)}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Unmapped" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Unmapped —</SelectItem>
                        {cashflowOptions.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {e.mapping_source && (
                      <Badge variant={sourceBadgeVariant(e.mapping_source)} className="text-[9px] py-0 h-4 capitalize">
                        {e.mapping_source}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="min-w-[220px]">Budget Line</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 500).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs">{e.posted_on}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs" title={e.merchant ?? ""}>{e.merchant}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs" title={e.description ?? ""}>{e.description}</TableCell>
                      <TableCell className={`text-right tabular-nums text-xs ${e.amount < 0 ? "text-destructive" : "text-green-600"}`}>
                        {fmtMoney(e.amount, e.currency)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={e.mapped_cashflow_id ?? "__none__"}
                          onValueChange={(v) => onChangeMapping(e, v)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Unmapped" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Unmapped —</SelectItem>
                            {cashflowOptions.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {e.mapping_source && (
                          <Badge variant={sourceBadgeVariant(e.mapping_source)} className="text-[10px] capitalize">
                            {e.mapping_source}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.account_provider}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 500 && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t">
                Showing first 500 of {filtered.length} — refine search to see more.
              </div>
            )}
          </>
        )}
      </Card>

      {/* Bulk-apply prompt */}
      <AlertDialog open={!!pendingChange} onOpenChange={(o) => !o && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply to similar transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              Map <span className="font-medium">{pendingChange?.expense.merchant || pendingChange?.expense.description}</span>{" "}
              to <span className="font-medium">{pendingChange?.cashflow_label}</span>.
              {pendingChange && pendingChange.similar_count > 0 ? (
                <> Found <span className="font-semibold">{pendingChange.similar_count}</span> similar past transactions.
                  Saving as a rule will also auto-map future matches.</>
              ) : (
                <> No similar past transactions found. Saving a rule will only affect future matches.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingChange(null)}>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => confirmMapping(false)}>Just this one</Button>
            <AlertDialogAction onClick={() => confirmMapping(true)}>
              Apply to all & save rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MappingRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} cashflowOptions={cashflowOptions} />

      <EnrichmentReviewDialog
        open={enrichOpen}
        onOpenChange={setEnrichOpen}
        proposals={enrichProposals}
        summary={enrichSummary}
        onApply={applyEnrichment}
        applying={applyingEnrich}
      />
    </div>
  );
}
