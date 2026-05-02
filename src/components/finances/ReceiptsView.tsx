import React, { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Link2, CheckCircle2, X } from "lucide-react";
import { useBankReceipts, useInvoicePayments, useInvoices, fmtMoney } from "@/hooks/useInvoicing";
import { toast } from "sonner";

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

const pick = (row: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) {
    if (row[k.toLowerCase()] != null && row[k.toLowerCase()] !== "") return row[k.toLowerCase()];
  }
  return "";
};

export function ReceiptsView() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { receipts, bulkInsert, update } = useBankReceipts();
  const { invoices } = useInvoices();
  const { add: addPayment } = useInvoicePayments();
  const [busy, setBusy] = useState(false);

  // suggest matches: invoice with matching balance OR invoice number in description/reference
  const suggestions = useMemo(() => {
    const map = new Map<string, string>();
    receipts.forEach((r) => {
      if (r.matched_invoice_id) return;
      const txt = `${r.description ?? ""} ${r.reference ?? ""} ${r.counterparty ?? ""}`.toLowerCase();
      const byNumber = invoices.find((i) => i.invoice_number && txt.includes(i.invoice_number.toLowerCase()));
      const byAmount = invoices.find(
        (i) => Math.abs(Number(i.balance_due) - Number(r.amount)) < 0.01 && i.status !== "paid"
      );
      const match = byNumber ?? byAmount;
      if (match) map.set(r.id, match.id);
    });
    return map;
  }, [receipts, invoices]);

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("Empty file");
      const parsed = rows.map((row) => {
        const dateRaw = pick(row, "date", "posted", "transaction date", "posted_on");
        const amount = parseFloat(pick(row, "amount", "credit", "value")) || 0;
        return {
          source: "csv" as const,
          external_id: pick(row, "id", "reference", "transaction id") || `${dateRaw}-${amount}-${pick(row, "description")}`,
          posted_on: new Date(dateRaw).toISOString().slice(0, 10),
          amount,
          currency: pick(row, "currency") || "GBP",
          description: pick(row, "description", "narrative", "details"),
          counterparty: pick(row, "payer", "counterparty", "from"),
          reference: pick(row, "reference"),
          raw: row,
        };
      });
      await bulkInsert.mutateAsync(parsed);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to import");
    } finally {
      setBusy(false);
    }
  };

  const matchReceipt = async (receiptId: string, invoiceId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return;
    await addPayment.mutateAsync({
      invoice_id: invoiceId,
      amount: receipt.amount,
      paid_on: receipt.posted_on,
      method: "bank_transfer",
      reference: receipt.reference ?? receipt.description ?? undefined,
      bank_receipt_id: receiptId,
    });
    await update.mutateAsync({ id: receiptId, matched_invoice_id: invoiceId, match_status: "matched" });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div>
            <h3 className="font-semibold">Bank receipts</h3>
            <p className="text-sm text-muted-foreground">Import payments via CSV/Excel or sync via Finexer to reconcile invoices.</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="h-4 w-4 mr-1" /> Import CSV
            </Button>
            <Button variant="secondary" disabled title="Configure in Settings → Finexer">
              <Link2 className="h-4 w-4 mr-1" /> Sync Finexer
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {receipts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No receipts yet. Upload a CSV to begin.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r) => {
                const suggested = suggestions.get(r.id);
                const matchedInvoice = invoices.find((i) => i.id === r.matched_invoice_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.posted_on}</TableCell>
                    <TableCell className="max-w-[280px] truncate" title={r.description ?? ""}>{r.description}</TableCell>
                    <TableCell>{r.counterparty}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(r.amount, r.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={r.match_status === "matched" ? "default" : "secondary"}>{r.match_status}</Badge>
                    </TableCell>
                    <TableCell>
                      {matchedInvoice ? (
                        <span className="text-xs">→ {matchedInvoice.invoice_number}</span>
                      ) : suggested ? (
                        <Button size="sm" variant="outline" onClick={() => matchReceipt(r.id, suggested)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Match {invoices.find((i) => i.id === suggested)?.invoice_number}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: r.id, match_status: "ignored" })}>
                          <X className="h-3.5 w-3.5 mr-1" />Ignore
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
