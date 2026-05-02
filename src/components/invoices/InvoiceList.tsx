import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useInvoices, fmtMoney, useCustomers } from "@/hooks/useInvoicing";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-700",
  viewed: "bg-blue-500/15 text-blue-700",
  partial: "bg-amber-500/15 text-amber-700",
  paid: "bg-green-500/15 text-green-700",
  overdue: "bg-red-500/15 text-red-700",
  void: "bg-muted text-muted-foreground line-through",
};

export function InvoiceList({ onEdit, onNew }: { onEdit: (id: string) => void; onNew: () => void }) {
  const { invoices, isLoading, remove } = useInvoices();
  const { customers } = useCustomers();
  const customerName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "void")
    .reduce((s, i) => s + Number(i.balance_due ?? 0), 0);
  const totalIssued = invoices.reduce((s, i) => s + Number(i.total ?? 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Outstanding</div><div className="text-xl font-semibold">{fmtMoney(totalOutstanding)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Issued</div><div className="text-xl font-semibold">{fmtMoney(totalIssued)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Received</div><div className="text-xl font-semibold">{fmtMoney(totalPaid)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Invoices</div><div className="text-xl font-semibold">{invoices.length}</div></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">All invoices</h3>
        <Button size="sm" onClick={onNew}><Plus className="h-4 w-4 mr-1" /> New invoice</Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoice_number}</TableCell>
                  <TableCell>{i.client_name ?? customerName(i.customer_id)}</TableCell>
                  <TableCell>{i.invoice_date}</TableCell>
                  <TableCell>{i.due_date ?? "—"}</TableCell>
                  <TableCell><Badge className={statusColors[i.status] ?? ""} variant="secondary">{i.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(i.total, i.currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(i.balance_due, i.currency)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(i.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove.mutate(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
