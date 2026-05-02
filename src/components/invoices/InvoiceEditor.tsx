import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Printer, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Invoice,
  InvoiceItem,
  fmtMoney,
  useBillingEntities,
  useCustomers,
  useInvoice,
  useInvoiceItemsMutations,
  useInvoices,
} from "@/hooks/useInvoicing";
import { useSpaces } from "@/hooks/useSpaces";
import { useProjects } from "@/hooks/useProjects";

type Props = {
  invoiceId: string | null;
  onSaved?: (id: string) => void;
};

const empty: Partial<Invoice> = {
  invoice_number: "",
  currency: "GBP",
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: new Date().toISOString().slice(0, 10),
  terms: "Due on receipt",
  seller_name: "",
  seller_address_lines: "",
  seller_bank_details: "",
  client_name: "",
  client_address_lines: "",
  subtotal: 0,
  vat_rate: 0,
  vat_amount: 0,
  other_charge: 0,
  total: 0,
  amount_paid: 0,
  balance_due: 0,
  status: "draft",
  payment_provider: "Bank transfer",
  payment_link: "",
  expected_payment_days: 7,
};

const emptyItem: Partial<InvoiceItem> = { service: "", description: "", meta: "", qty: 1, rate: 0 };

export function InvoiceEditor({ invoiceId, onSaved }: Props) {
  const { entities } = useBillingEntities();
  const { customers } = useCustomers();
  const { spaces } = useSpaces();
  const { projects } = useProjects();
  const loaded = useInvoice(invoiceId);
  const { upsert } = useInvoices();
  const itemsMut = useInvoiceItemsMutations();

  const [draft, setDraft] = useState<Partial<Invoice>>(empty);
  const [items, setItems] = useState<Array<Partial<InvoiceItem>>>([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);

  // Hydrate from loaded invoice
  useEffect(() => {
    if (loaded.data?.invoice) {
      setDraft(loaded.data.invoice);
      setItems(
        loaded.data.items.length
          ? loaded.data.items
          : [{ ...emptyItem }]
      );
    } else if (!invoiceId) {
      // suggest invoice number from default entity
      const def = entities.find((e) => e.is_default) ?? entities[0];
      if (def) {
        const seq = String(def.next_invoice_seq).padStart(2, "0");
        setDraft((d) => ({
          ...d,
          billing_entity_id: def.id,
          invoice_number:
            d.invoice_number ||
            `${def.invoice_number_prefix ?? new Date().toISOString().slice(0, 7).replace("-", "")}-${seq}`,
          currency: def.default_currency,
          terms: def.default_terms ?? "Due on receipt",
          seller_name: def.name,
          seller_address_lines: def.address_lines ?? "",
          seller_bank_details: def.bank_details ?? "",
          payment_provider: def.default_payment_provider ?? "Bank transfer",
          payment_link: def.default_payment_link ?? "",
          vat_rate: Number(def.default_vat_rate ?? 0),
        }));
      }
    }
  }, [loaded.data, invoiceId, entities]);

  // Apply selected customer to client snapshot fields + auto invoice number per client
  const applyCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    const seq = String(c.next_invoice_seq ?? 1).padStart(3, "0");
    const ref = c.reference_code || c.name.slice(0, 4).toUpperCase().replace(/\s+/g, "");
    setDraft((d) => ({
      ...d,
      customer_id: id,
      client_name: c.name,
      client_address_lines: c.address_lines ?? "",
      // Auto-generate per-client invoice number when creating new (no existing id)
      invoice_number: invoiceId || d.id ? d.invoice_number : `${ref}-${seq}`,
    }));
  };

  const applyEntity = (id: string) => {
    const e = entities.find((x) => x.id === id);
    if (!e) return;
    setDraft((d) => ({
      ...d,
      billing_entity_id: id,
      seller_name: e.name,
      seller_address_lines: e.address_lines ?? "",
      seller_bank_details: e.bank_details ?? "",
      payment_provider: e.default_payment_provider ?? d.payment_provider,
      payment_link: e.default_payment_link ?? d.payment_link,
      currency: e.default_currency,
    }));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + Number(it.qty ?? 0) * Number(it.rate ?? 0), 0);
    const vat = (subtotal * Number(draft.vat_rate ?? 0)) / 100;
    const other = Number(draft.other_charge ?? 0);
    const total = subtotal + vat + other;
    return { subtotal, vat, total };
  }, [items, draft.vat_rate, draft.other_charge]);

  const filteredProjects = projects.filter(
    (p) => !draft.space_id || p.space_id === draft.space_id
  );

  const setItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const handleSave = async (statusOverride?: Invoice["status"]) => {
    if (!draft.invoice_number) {
      toast.error("Invoice number is required");
      return;
    }
    setSaving(true);
    try {
      const isNew = !invoiceId && !draft.id;
      const payload: Partial<Invoice> = {
        ...draft,
        subtotal: totals.subtotal,
        vat_amount: totals.vat,
        total: totals.total,
        balance_due: totals.total - Number(draft.amount_paid ?? 0),
        status: statusOverride ?? draft.status ?? "draft",
      };
      const saved = await upsert.mutateAsync(payload);
      await itemsMut.replaceAll.mutateAsync({ invoiceId: saved.id, items });
      // Bump per-client invoice sequence on first save
      if (isNew && draft.customer_id) {
        const cust = customers.find((c) => c.id === draft.customer_id);
        if (cust) {
          await supabase
            .from("customers")
            .update({ next_invoice_seq: (cust.next_invoice_seq ?? 1) + 1 })
            .eq("id", cust.id);
        }
      }
      toast.success("Invoice saved");
      onSaved?.(saved.id);
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceId && !draft.id) {
      await handleSave("draft");
    }
    setEmailing(true);
    try {
      const id = invoiceId ?? draft.id;
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoiceId: id },
      });
      if (error) throw error;
      toast.success(data?.message ?? "Email sent");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send email");
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-4 h-full">
      {/* ============== Left: editor controls ============== */}
      <aside className="bg-card border rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-180px)] space-y-5">
        {/* Setup */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice setup</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Invoice #</Label>
              <Input value={draft.invoice_number ?? ""} onChange={(e) => setDraft({ ...draft, invoice_number: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={draft.currency ?? "GBP"} onValueChange={(v) => setDraft({ ...draft, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={draft.invoice_date ?? ""} onChange={(e) => setDraft({ ...draft, invoice_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Due</Label>
              <Input type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Terms</Label>
              <Input value={draft.terms ?? ""} onChange={(e) => setDraft({ ...draft, terms: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Sender */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From (billing entity)</h3>
          <Select value={draft.billing_entity_id ?? ""} onValueChange={applyEntity}>
            <SelectTrigger><SelectValue placeholder="Pick a billing entity" /></SelectTrigger>
            <SelectContent>
              {entities.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}{e.is_default ? " (default)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Sender name" value={draft.seller_name ?? ""} onChange={(e) => setDraft({ ...draft, seller_name: e.target.value })} />
          <Textarea rows={4} placeholder="Sender address" value={draft.seller_address_lines ?? ""} onChange={(e) => setDraft({ ...draft, seller_address_lines: e.target.value })} />
        </section>

        {/* Client */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To (customer)</h3>
          <Select value={draft.customer_id ?? ""} onValueChange={applyCustomer}>
            <SelectTrigger><SelectValue placeholder="Pick a customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Client name" value={draft.client_name ?? ""} onChange={(e) => setDraft({ ...draft, client_name: e.target.value })} />
          <Textarea rows={3} placeholder="Client address" value={draft.client_address_lines ?? ""} onChange={(e) => setDraft({ ...draft, client_address_lines: e.target.value })} />
        </section>

        {/* Linkage */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link to plan & finance</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Space</Label>
              <Select value={draft.space_id ?? "__none__"} onValueChange={(v) => setDraft({ ...draft, space_id: v === "__none__" ? null : v, project_id: null })}>
                <SelectTrigger><SelectValue placeholder="Space" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Project</Label>
              <Select value={draft.project_id ?? "__none__"} onValueChange={(v) => setDraft({ ...draft, project_id: v === "__none__" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {filteredProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Cost centre</Label>
              <Input value={draft.cost_centre ?? ""} onChange={(e) => setDraft({ ...draft, cost_centre: e.target.value })} placeholder="e.g. Maud Street" />
            </div>
          </div>
        </section>

        {/* Line items */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line items</h3>
          {items.map((it, idx) => (
            <div key={idx} className="border rounded-lg p-2 space-y-1 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Line {idx + 1}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setItems((a) => a.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input placeholder="Service" value={it.service ?? ""} onChange={(e) => setItem(idx, { service: e.target.value })} />
              <Textarea rows={2} placeholder="Description" value={it.description ?? ""} onChange={(e) => setItem(idx, { description: e.target.value })} />
              <Textarea rows={2} placeholder="Side note (e.g. Week 4)" value={it.meta ?? ""} onChange={(e) => setItem(idx, { meta: e.target.value })} />
              <div className="grid grid-cols-3 gap-1">
                <Input type="number" placeholder="Qty" value={String(it.qty ?? 0)} onChange={(e) => setItem(idx, { qty: Number(e.target.value) })} />
                <Input type="number" placeholder="Rate" value={String(it.rate ?? 0)} onChange={(e) => setItem(idx, { rate: Number(e.target.value) })} />
                <div className="flex items-center justify-end text-sm tabular-nums px-2">
                  {fmtMoney(Number(it.qty ?? 0) * Number(it.rate ?? 0), draft.currency)}
                </div>
              </div>
            </div>
          ))}
          <Button variant="secondary" className="w-full" onClick={() => setItems((a) => [...a, { ...emptyItem }])}>
            <Plus className="h-4 w-4 mr-1" /> Add line
          </Button>
        </section>

        {/* Tax & payment */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax & payment</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">VAT %</Label>
              <Input type="number" value={String(draft.vat_rate ?? 0)} onChange={(e) => setDraft({ ...draft, vat_rate: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Other</Label>
              <Input type="number" value={String(draft.other_charge ?? 0)} onChange={(e) => setDraft({ ...draft, other_charge: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Payment link</Label>
              <Input value={draft.payment_link ?? ""} onChange={(e) => setDraft({ ...draft, payment_link: e.target.value })} />
            </div>
          </div>
          <Textarea rows={5} placeholder="Bank / payout details" value={draft.seller_bank_details ?? ""} onChange={(e) => setDraft({ ...draft, seller_bank_details: e.target.value })} />
        </section>

        {/* Email body */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email message</h3>
          <Input placeholder="Subject" value={draft.email_subject ?? `Invoice ${draft.invoice_number ?? ""} from ${draft.seller_name ?? ""}`} onChange={(e) => setDraft({ ...draft, email_subject: e.target.value })} />
          <Textarea rows={6} value={draft.email_body ?? ""} onChange={(e) => setDraft({ ...draft, email_body: e.target.value })} placeholder={`Hi ${draft.client_name ?? "{customer}"},\n\nPlease find attached invoice ${draft.invoice_number ?? ""} for ${fmtMoney(totals.total, draft.currency)} due on ${draft.due_date ?? ""}.\n\nThanks,\n${draft.seller_name ?? ""}`} />
        </section>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
          <Button variant="secondary" onClick={() => handleSave("sent").then(handleSendEmail)} disabled={emailing}>
            {emailing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Send
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print / PDF
          </Button>
        </div>
      </aside>

      {/* ============== Right: live preview matching uploaded HTML ============== */}
      <main className="overflow-auto max-h-[calc(100vh-180px)]">
        <InvoicePreview draft={draft} items={items} totals={totals} />
      </main>
    </div>
  );
}

// ====================================================================
// Pixel-faithful preview — semantic colors but layout matches the brief
// ====================================================================
export function InvoicePreview({
  draft,
  items,
  totals,
}: {
  draft: Partial<Invoice>;
  items: Array<Partial<InvoiceItem>>;
  totals: { subtotal: number; vat: number; total: number };
}) {
  const lines = (s?: string | null) =>
    String(s ?? "")
      .split("\n")
      .map((l, i) => <p key={i} className="my-0.5 leading-snug">{l || "\u00A0"}</p>);

  return (
    <div className="invoice-print bg-[#efefef] rounded-2xl shadow-lg border max-w-[900px] mx-auto">
      <div className="p-10 sm:p-12 min-h-[1000px] text-[#1d2630]">
        {/* Top: seller + meta */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.15fr,0.85fr] gap-6">
          <div>
            <div className="font-semibold text-lg mb-2">{draft.seller_name ?? "Sender"}</div>
            <div className="text-sm text-[#44505c]">{lines(draft.seller_address_lines)}</div>
          </div>
          <div className="grid grid-cols-[1fr,auto] gap-x-4 gap-y-1 sm:justify-self-end self-start text-sm">
            <div className="uppercase text-[#a2abb4]">Invoice</div><div className="font-medium">{draft.invoice_number}</div>
            <div className="uppercase text-[#a2abb4]">Date</div><div className="font-medium">{draft.invoice_date}</div>
            <div className="uppercase text-[#a2abb4]">Terms</div><div className="font-medium">{draft.terms}</div>
            <div className="uppercase text-[#a2abb4]">Due Date</div><div className="font-medium">{draft.due_date}</div>
          </div>
        </div>

        <h1 className="text-[#69a8d8] text-4xl font-light tracking-tight mt-14 mb-8">INVOICE</h1>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr,0.75fr] gap-8">
          <div>
            <div className="uppercase text-[#a2abb4] text-xs mb-2">Invoice to</div>
            <p className="font-semibold mb-1">{draft.client_name}</p>
            <div className="text-sm text-[#44505c]">{lines(draft.client_address_lines)}</div>
          </div>
        </div>

        <table className="w-full mt-8 text-sm border-collapse">
          <thead>
            <tr className="bg-[#d7e8f4] text-[#5d95be]">
              <th className="text-left font-medium px-2 py-1.5">SERVICE</th>
              <th className="text-left font-medium px-2 py-1.5">DESCRIPTION</th>
              <th className="text-right font-medium px-2 py-1.5">QTY</th>
              <th className="text-right font-medium px-2 py-1.5">RATE</th>
              <th className="text-right font-medium px-2 py-1.5">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const amount = Number(it.qty ?? 0) * Number(it.rate ?? 0);
              return (
                <tr key={i} className="align-top">
                  <td className="px-2 pt-3 pb-4">
                    <div className="font-medium">{it.service}</div>
                    {it.meta ? <div className="text-xs text-[#7f8a96] mt-1 whitespace-pre-line">{it.meta}</div> : null}
                  </td>
                  <td className="px-2 pt-3 pb-4 whitespace-pre-line">{it.description}</td>
                  <td className="px-2 pt-3 pb-4 text-right">{Number(it.qty ?? 0)}</td>
                  <td className="px-2 pt-3 pb-4 text-right">{fmtMoney(Number(it.rate ?? 0), draft.currency)}</td>
                  <td className="px-2 pt-3 pb-4 text-right">{fmtMoney(amount, draft.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div></div>
          <div className="text-sm text-[#44505c]">{lines(draft.seller_bank_details)}</div>
        </div>

        <div className="flex justify-end gap-6 items-center border-t-2 border-dotted border-[#c2c7cc] mt-6 pt-3">
          <span className="uppercase text-[#a4acb5] text-xs">Balance Due</span>
          <strong className="text-3xl">{fmtMoney(totals.total - Number(draft.amount_paid ?? 0), draft.currency)}</strong>
        </div>
      </div>
    </div>
  );
}
