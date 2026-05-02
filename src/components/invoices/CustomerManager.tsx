import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Customer, useCustomers } from "@/hooks/useInvoicing";

export function CustomerManager() {
  const { customers, isLoading, upsert, remove } = useCustomers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);

  const startNew = () => {
    setEditing({ name: "", email: "", phone: "", address_lines: "" });
    setOpen(true);
  };

  const startEdit = (c: Customer) => {
    setEditing(c);
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
        <h3 className="text-sm font-semibold">Customers</h3>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New</Button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : customers.length === 0 ? (
        <div className="text-sm text-muted-foreground p-6 text-center border rounded-lg">No customers yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((c) => (
            <Card key={c.id} className="p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{c.name}</div>
                    {(c as any).reference_code ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{(c as any).reference_code}</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                  {c.address_lines ? <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">{c.address_lines}</div> : null}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit customer" : "New customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr,160px] gap-2">
              <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
              <div><Label>Reference #</Label><Input placeholder="ACME-001" value={(editing as any)?.reference_code ?? ""} onChange={(e) => setEditing({ ...editing!, reference_code: e.target.value } as any)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Email</Label><Input value={editing?.email ?? ""} onChange={(e) => setEditing({ ...editing!, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={editing?.phone ?? ""} onChange={(e) => setEditing({ ...editing!, phone: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Textarea rows={3} value={editing?.address_lines ?? ""} onChange={(e) => setEditing({ ...editing!, address_lines: e.target.value })} /></div>
            <div><Label>Tax / VAT ID</Label><Input value={editing?.tax_id ?? ""} onChange={(e) => setEditing({ ...editing!, tax_id: e.target.value })} /></div>
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
