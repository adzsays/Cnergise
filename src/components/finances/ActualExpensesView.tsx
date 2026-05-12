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
import {
  Upload, Link2, Loader2, Trash2, Search, Sparkles, Settings2, Wand2,
  ArrowUp, ArrowDown, ArrowUpDown, AlertCircle, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { fmtMoney } from "@/hooks/useInvoicing";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { MappingRulesDialog } from "./MappingRulesDialog";
import { EnrichmentReviewDialog, type EnrichmentProposal, type EnrichmentSummary } from "./EnrichmentReviewDialog";
import { cn } from "@/lib/utils";

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

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const PAGE_SIZE = 100;
const FETCH_CHUNK = 1000;

type SortKey = "posted_on" | "merchant" | "description" | "amount" | "mapped" | "account";

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
  const [unclVisible, setUnclVisible] = useState(PAGE_SIZE);
  const [clsVisible, setClsVisible] = useState(PAGE_SIZE);
  const [sortKey, setSortKey] = useState<SortKey>("posted_on");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { getSetting } = useSystemSettings();
  const { transactions, accounts } = useFinancialData() as any;

  const [pendingChange, setPendingChange] = useState<{
    expense: ActualExpense;
    cashflow_id: string;
    cashflow_label: string;
    similar_count: number;
  } | null>(null);

  // Independent fetch of cash-flow lines (don't rely solely on FinancialDataContext, which can
  // fail with an auth-lock AbortError and leave `transactions` empty — that would make the Budget
  // Line Select render the placeholder for classified rows even though they ARE mapped).
  const { data: cashflowLines = [] } = useQuery({
    queryKey: ["actual_expenses", "cashflow_options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("id, type, category, subcategory, cost_centre");
      if (error) throw error;
      return data ?? [];
    },
    retry: 3,
    staleTime: 60_000,
  });

  const cashflowOptions = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of (cashflowLines as any[])) map.set(t.id, t);
    for (const t of (transactions || []) as any[]) if (!map.has(t.id)) map.set(t.id, t);
    return Array.from(map.values()).map((t: any) => ({
      id: t.id,
      label: `${t.type === "income" ? "+" : "−"} ${t.subcategory || t.category} (${t.cost_centre || "—"})`,
      cost_centre: t.cost_centre,
    }));
  }, [cashflowLines, transactions]);

  // Fetch ALL expenses (paged through Supabase 1000-row limit)
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["actual_expenses", "all"],
    queryFn: async () => {
      const all: ActualExpense[] = [];
      let from = 0;
      // Hard upper bound to avoid pathological loops
      for (let i = 0; i < 50; i++) {
        const to = from + FETCH_CHUNK - 1;
        const { data, error } = await supabase
          .from("actual_expenses" as any)
          .select("*")
          .order("posted_on", { ascending: false })
          .range(from, to);
        if (error) throw error;
        const batch = (data ?? []) as unknown as ActualExpense[];
        all.push(...batch);
        if (batch.length < FETCH_CHUNK) break;
        from += FETCH_CHUNK;
      }
      return all;
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

  const onChangeMapping = (e: ActualExpense, newCashflowId: string) => {
    if (newCashflowId === "__none__") {
      supabase
        .from("actual_expenses" as any)
        .update({ mapped_cashflow_id: null, mapping_source: null, mapping_confidence: null })
        .eq("id", e.id)
        .then(() => qc.invalidateQueries({ queryKey: ["actual_expenses"] }));
      return;
    }
    const matchKey = (e.merchant || e.description || "").trim();
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

  // ---- Bank account matching + running balance ----
  // Match an expense to a financial_account by name or provider (case-insensitive substring).
  const bankAccounts = useMemo(
    () => (accounts || []).filter((a: any) => (a.type || "").toLowerCase() === "asset"),
    [accounts]
  );

  const accountKeyForExpense = (e: ActualExpense): string | null => {
    const candidates = [e.account_name, e.account_provider].filter(Boolean) as string[];
    if (candidates.length === 0) return null;
    for (const acc of bankAccounts) {
      const accNorm = norm(acc.name);
      for (const c of candidates) {
        const cn = norm(c);
        if (cn && (cn === accNorm || cn.includes(accNorm) || accNorm.includes(cn))) {
          return acc.id;
        }
      }
    }
    // Fallback: group by raw account_name string so they at least share a running ledger
    return `__txt:${norm(candidates[0])}`;
  };

  // Running balance per account: sort that account's expenses ascending by date,
  // start from opening_balance (if matched & posted_on >= opening_balance_date) and accumulate.
  const balanceByExpenseId = useMemo(() => {
    const map = new Map<string, number>();
    const groups = new Map<string, ActualExpense[]>();
    for (const e of expenses) {
      const k = accountKeyForExpense(e) ?? "__none";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(e);
    }
    for (const [key, list] of groups) {
      const acc = bankAccounts.find((a: any) => a.id === key);
      const openingBal = acc?.opening_balance ? Number(acc.opening_balance) : 0;
      const openingDate = acc?.opening_balance_date || null;
      const sorted = [...list].sort((a, b) =>
        a.posted_on === b.posted_on ? a.id.localeCompare(b.id) : a.posted_on.localeCompare(b.posted_on)
      );
      let running = openingBal;
      for (const e of sorted) {
        if (!openingDate || e.posted_on >= openingDate) {
          running += Number(e.amount) || 0;
        }
        map.set(e.id, running);
      }
    }
    return map;
  }, [expenses, bankAccounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) =>
      [e.merchant, e.description, e.category, e.account_provider, e.account_name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [expenses, search]);

  const sortFn = (a: ActualExpense, b: ActualExpense) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const get = (e: ActualExpense): string | number => {
      switch (sortKey) {
        case "posted_on": return e.posted_on;
        case "amount": return Number(e.amount);
        case "merchant": return (e.merchant || "").toLowerCase();
        case "description": return (e.description || "").toLowerCase();
        case "mapped": return e.mapped_cashflow_id ? 1 : 0;
        case "account": return (e.account_name || e.account_provider || "").toLowerCase();
      }
    };
    const av = get(a), bv = get(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };

  const unclassified = useMemo(
    () => filtered.filter((e) => !e.mapped_cashflow_id).sort(sortFn),
    [filtered, sortKey, sortDir]
  );
  const classified = useMemo(
    () => filtered.filter((e) => !!e.mapped_cashflow_id).sort(sortFn),
    [filtered, sortKey, sortDir]
  );

  React.useEffect(() => { setUnclVisible(PAGE_SIZE); setClsVisible(PAGE_SIZE); }, [search, expenses.length]);

  const totals = useMemo(() => {
    const inflow = filtered.filter((e) => e.amount > 0).reduce((s, e) => s + Number(e.amount), 0);
    const outflow = filtered.filter((e) => e.amount < 0).reduce((s, e) => s + Number(e.amount), 0);
    const mapped = classified.length;
    return { inflow, outflow, net: inflow + outflow, mapped, unmapped: filtered.length - mapped };
  }, [filtered, classified]);

  const cashflowLabel = (id: string | null) =>
    id ? cashflowOptions.find((c: any) => c.id === id)?.label || "—" : "—";

  // --- Reconciliation panel state ---
  const [reconAccountId, setReconAccountId] = useState<string>("");
  const [reconDate, setReconDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reconExpected, setReconExpected] = useState<string>("");

  const reconResult = useMemo(() => {
    if (!reconAccountId || !reconDate) return null;
    const acc = bankAccounts.find((a: any) => a.id === reconAccountId);
    if (!acc) return null;
    const openingBal = acc.opening_balance ? Number(acc.opening_balance) : 0;
    const openingDate = acc.opening_balance_date || null;
    const accExpenses = expenses.filter((e) => accountKeyForExpense(e) === reconAccountId);
    const upTo = accExpenses.filter((e) => e.posted_on <= reconDate &&
      (!openingDate || e.posted_on >= openingDate));
    const sumAfterOpening = upTo.reduce((s, e) => s + Number(e.amount), 0);
    const calculated = openingBal + sumAfterOpening;
    const expected = parseFloat(reconExpected);
    const diff = isNaN(expected) ? null : calculated - expected;
    const unmappedInRange = upTo.filter((e) => !e.mapped_cashflow_id).length;
    return {
      accountName: acc.name,
      currency: acc.currency || "GBP",
      openingBal,
      openingDate,
      txnCount: upTo.length,
      calculated,
      expected: isNaN(expected) ? null : expected,
      diff,
      unmappedInRange,
    };
  }, [reconAccountId, reconDate, reconExpected, expenses, bankAccounts]);

  const SortHead = ({ k, label, align = "left", className = "" }: {
    k: SortKey; label: string; align?: "left" | "right"; className?: string;
  }) => {
    const active = sortKey === k;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <TableHead className={cn(align === "right" && "text-right", className)}>
        <button
          type="button"
          onClick={() => {
            if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            else { setSortKey(k); setSortDir("desc"); }
          }}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground transition-colors",
            align === "right" && "flex-row-reverse",
            active && "text-foreground"
          )}
        >
          {label}
          <Icon className="h-3 w-3 opacity-60" />
        </button>
      </TableHead>
    );
  };

  const renderDesktopRows = (rows: ActualExpense[]) => rows.map((e) => {
    const bal = balanceByExpenseId.get(e.id);
    return (
      <TableRow key={e.id}>
        <TableCell className="whitespace-nowrap text-xs">{e.posted_on}</TableCell>
        <TableCell className="max-w-[160px] truncate text-xs" title={e.merchant ?? ""}>{e.merchant}</TableCell>
        <TableCell className="max-w-[220px] truncate text-xs" title={e.description ?? ""}>{e.description}</TableCell>
        <TableCell className={`text-right tabular-nums text-xs ${e.amount < 0 ? "text-destructive" : "text-green-600"}`}>
          {fmtMoney(e.amount, e.currency)}
        </TableCell>
        <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
          {bal != null ? fmtMoney(bal, e.currency) : "—"}
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
        <TableCell className="text-xs text-muted-foreground">{e.account_name || e.account_provider}</TableCell>
        <TableCell>
          <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      </TableRow>
    );
  });

  const renderMobileRows = (rows: ActualExpense[]) => rows.map((e) => {
    const bal = balanceByExpenseId.get(e.id);
    return (
      <div key={e.id} className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{e.merchant || e.description || "—"}</div>
            <div className="text-xs text-muted-foreground truncate">{e.description}</div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {e.posted_on} · {e.account_name || e.account_provider || "—"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-sm font-semibold tabular-nums ${e.amount < 0 ? "text-destructive" : "text-green-600"}`}>
              {fmtMoney(e.amount, e.currency)}
            </div>
            {bal != null && (
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Bal: {fmtMoney(bal, e.currency)}
              </div>
            )}
            <Button size="icon" variant="ghost" className="h-6 w-6 mt-1" onClick={() => remove.mutate(e.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Select value={e.mapped_cashflow_id ?? "__none__"} onValueChange={(v) => onChangeMapping(e, v)}>
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
    );
  });

  const renderSection = (
    title: string,
    rows: ActualExpense[],
    visibleCount: number,
    setVisible: (n: number | ((c: number) => number)) => void,
    emptyHint: string,
    accent?: "warn"
  ) => {
    const slice = rows.slice(0, visibleCount);
    return (
      <Card>
        <div className={cn(
          "p-3 border-b flex items-center gap-2 flex-wrap",
          accent === "warn" && "bg-amber-500/5"
        )}>
          {accent === "warn"
            ? <AlertCircle className="h-4 w-4 text-amber-600" />
            : <CheckCircle2 className="h-4 w-4 text-green-600" />}
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="outline" className="text-[10px]">{rows.length}</Badge>
        </div>
        {rows.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">{emptyHint}</div>
        ) : (
          <>
            <div className="md:hidden divide-y">{renderMobileRows(slice)}</div>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead k="posted_on" label="Date" />
                    <SortHead k="merchant" label="Merchant" />
                    <SortHead k="description" label="Description" />
                    <SortHead k="amount" label="Amount" align="right" />
                    <TableHead className="text-right">Balance</TableHead>
                    <SortHead k="mapped" label="Budget Line" className="min-w-[220px]" />
                    <TableHead>Source</TableHead>
                    <SortHead k="account" label="Account" />
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderDesktopRows(slice)}</TableBody>
              </Table>
            </div>
            {visibleCount < rows.length && (
              <div className="p-3 text-center border-t">
                <Button variant="outline" size="sm" onClick={() => setVisible((c: number) => c + PAGE_SIZE)}>
                  Load more ({rows.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

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

      {/* Reconciliation panel */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-sm">Reconciliation</h3>
            <p className="text-xs text-muted-foreground">
              Compare a bank's actual balance on a date against the calculated balance from your transactions.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Account</label>
            <Select value={reconAccountId} onValueChange={setReconAccountId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.length === 0 ? (
                  <SelectItem value="__none__" disabled>No bank accounts — add one in Accounts</SelectItem>
                ) : (
                  bankAccounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">As-of Date</label>
            <Input type="date" value={reconDate} onChange={(e) => setReconDate(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Expected Balance</label>
            <Input
              type="number"
              step="0.01"
              placeholder="From your bank app"
              value={reconExpected}
              onChange={(e) => setReconExpected(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex items-end">
            <div className="w-full text-xs space-y-1">
              {reconResult ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Opening:</span>
                    <span className="tabular-nums">{fmtMoney(reconResult.openingBal, reconResult.currency)}{reconResult.openingDate ? ` (${reconResult.openingDate})` : ""}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Calculated:</span>
                    <span className="font-semibold tabular-nums">{fmtMoney(reconResult.calculated, reconResult.currency)}</span>
                  </div>
                  {reconResult.diff != null && (
                    <div className={cn(
                      "flex justify-between font-semibold",
                      Math.abs(reconResult.diff) < 0.01 ? "text-green-600" : "text-amber-600"
                    )}>
                      <span>Variance:</span>
                      <span className="tabular-nums">{fmtMoney(reconResult.diff, reconResult.currency)}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    {reconResult.txnCount} txns · {reconResult.unmappedInRange} unmapped
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Pick an account & date to reconcile.</div>
              )}
            </div>
          </div>
        </div>
        {reconResult && reconResult.diff != null && Math.abs(reconResult.diff) >= 0.01 && (
          <div className="mt-3 p-2 rounded bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
            Calculated is {reconResult.diff > 0 ? "higher" : "lower"} than expected by{" "}
            <span className="font-semibold">{fmtMoney(Math.abs(reconResult.diff), reconResult.currency)}</span>.
            Check for missing transactions, duplicate entries, or an incorrect opening balance.
          </div>
        )}
      </Card>

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
      </Card>

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No transactions yet. Upload your bank statement to get started.
        </Card>
      ) : (
        <>
          {renderSection(
            "Unclassified — needs allocation",
            unclassified,
            unclVisible,
            setUnclVisible,
            "All transactions are classified.",
            "warn"
          )}
          {renderSection(
            "Classified transactions",
            classified,
            clsVisible,
            setClsVisible,
            "No classified transactions yet."
          )}
        </>
      )}

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
