import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Link2, Loader2, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { fmtMoney } from "@/hooks/useInvoicing";

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
};

// Excel serial date -> ISO date
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

export function ActualExpensesView() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const { getSetting } = useSystemSettings();

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
      // chunk to avoid payload limits
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
          posted_on,
          amount,
          currency: r["Currency"] ?? "GBP",
          merchant,
          description,
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
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to import");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
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
      // Placeholder hookup for future Finexer edge function
      toast.info("Finexer sync will be available once the connector is enabled.");
    } finally {
      setSyncing(false);
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
    return { inflow, outflow, net: inflow + outflow };
  }, [filtered]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h3 className="font-semibold">Actual expenses</h3>
            <p className="text-sm text-muted-foreground">
              Upload a bank export (Excel/CSV) or sync via Finexer. Expected columns: Date, Merchant Name, Description, Amount, Category, Notes, Account Provider, Account Name, Status, Sub Type.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Upload Excel
            </Button>
            <Button variant="secondary" onClick={handleFinexerSync} disabled={syncing}>
              <Link2 className="h-4 w-4 mr-1" /> Sync Finexer
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            No expenses yet. Upload your bank statement to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 500).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{e.posted_on}</TableCell>
                    <TableCell className="max-w-[180px] truncate" title={e.merchant ?? ""}>{e.merchant}</TableCell>
                    <TableCell className="max-w-[260px] truncate" title={e.description ?? ""}>{e.description}</TableCell>
                    <TableCell>{e.category && <Badge variant="secondary">{e.category}</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.account_provider}</TableCell>
                    <TableCell className={`text-right tabular-nums ${e.amount < 0 ? "text-destructive" : "text-green-600"}`}>
                      {fmtMoney(e.amount, e.currency)}
                    </TableCell>
                    <TableCell>{e.status && <Badge variant="outline">{e.status}</Badge>}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length > 500 && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t">
                Showing first 500 of {filtered.length} — refine search to see more.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
