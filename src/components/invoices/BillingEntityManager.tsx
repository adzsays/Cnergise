import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { BillingEntity, useBillingEntities } from "@/hooks/useInvoicing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BillingEntityManager() {
  const { entities, isLoading, upsert, remove } = useBillingEntities();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<BillingEntity> | null>(null);

  const startNew = () => {
    setEditing({ name: "", default_currency: "GBP", default_terms: "Due on receipt", next_invoice_seq: 1, is_default: entities.length === 0 });
    setOpen(true);
  };

  const startEdit = (e: BillingEntity) => {
    setEditing(e);
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name) return;
    await upsert.mutateAsync(editing);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Billing entities (your "from" profiles)</h3>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New</Button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : entities.length === 0 ? (
        <div className="text-sm text-muted-foreground p-6 text-center border rounded-lg">No billing entities yet. Add one to start invoicing.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {entities.map((e) => (
            <Card key={e.id} className="p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-1 truncate">
                    {e.name}
                    {e.is_default && <Star className="h-3.5 w-3.5 fill-current text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{e.email} · {e.default_currency}</div>
                  {e.address_lines ? <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">{e.address_lines}</div> : null}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove.mutate(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-2"><DialogTitle>{editing?.id ? "Edit billing entity" : "New billing entity"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 px-1">
            <div className="space-y-1"><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Reply-to email</Label><Input value={editing?.email ?? ""} onChange={(e) => setEditing({ ...editing!, email: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-1"><Label>Address</Label><Textarea rows={3} value={editing?.address_lines ?? ""} onChange={(e) => setEditing({ ...editing!, address_lines: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-1"><Label>Bank / payout details</Label><Textarea rows={3} value={editing?.bank_details ?? ""} onChange={(e) => setEditing({ ...editing!, bank_details: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={editing?.default_currency ?? "GBP"} onValueChange={(v) => setEditing({ ...editing!, default_currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>VAT %</Label><Input type="number" value={String(editing?.default_vat_rate ?? 0)} onChange={(e) => setEditing({ ...editing!, default_vat_rate: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Inv # prefix</Label><Input value={editing?.invoice_number_prefix ?? ""} onChange={(e) => setEditing({ ...editing!, invoice_number_prefix: e.target.value })} /></div>
            </div>
            <div className="space-y-1 sm:col-span-2"><Label>Default terms</Label><Input value={editing?.default_terms ?? ""} onChange={(e) => setEditing({ ...editing!, default_terms: e.target.value })} /></div>
            <div className="space-y-1"><Label>Payment provider</Label><Input value={editing?.default_payment_provider ?? ""} onChange={(e) => setEditing({ ...editing!, default_payment_provider: e.target.value })} /></div>
            <div className="space-y-1"><Label>Payment link</Label><Input value={editing?.default_payment_link ?? ""} onChange={(e) => setEditing({ ...editing!, default_payment_link: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 pt-1">
              <input type="checkbox" checked={!!editing?.is_default} onChange={(e) => setEditing({ ...editing!, is_default: e.target.checked })} />
              Default entity
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
