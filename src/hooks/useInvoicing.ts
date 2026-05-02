import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BillingEntity = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  address_lines: string | null;
  logo_url: string | null;
  bank_details: string | null;
  default_payment_provider: string | null;
  default_payment_link: string | null;
  default_terms: string | null;
  default_currency: string;
  default_vat_rate: number;
  invoice_number_prefix: string | null;
  next_invoice_seq: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_lines: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  user_id: string;
  position: number;
  service: string | null;
  description: string | null;
  meta: string | null;
  qty: number;
  rate: number;
  amount: number;
  created_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  billing_entity_id: string | null;
  customer_id: string | null;
  space_id: string | null;
  project_id: string | null;
  cost_centre: string | null;
  invoice_number: string;
  currency: string;
  invoice_date: string;
  due_date: string | null;
  terms: string | null;
  seller_name: string | null;
  seller_address_lines: string | null;
  seller_bank_details: string | null;
  client_name: string | null;
  client_address_lines: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  other_charge: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "void";
  payment_provider: string | null;
  payment_link: string | null;
  email_subject: string | null;
  email_body: string | null;
  notes: string | null;
  expected_payment_days: number | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoicePayment = {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  paid_on: string;
  method: string | null;
  reference: string | null;
  bank_receipt_id: string | null;
  notes: string | null;
  created_at: string;
};

export type BankReceipt = {
  id: string;
  user_id: string;
  source: string;
  external_id: string | null;
  posted_on: string;
  amount: number;
  currency: string;
  description: string | null;
  counterparty: string | null;
  reference: string | null;
  matched_invoice_id: string | null;
  match_status: "unmatched" | "suggested" | "matched" | "ignored";
  match_confidence: number | null;
  raw: any;
  created_at: string;
  updated_at: string;
};

const inv = (qc: ReturnType<typeof useQueryClient>) => () =>
  qc.invalidateQueries({ queryKey: ["invoicing"] });

// ---------- Billing entities ----------
export function useBillingEntities() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["invoicing", "billing_entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_entities")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BillingEntity[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<BillingEntity> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const row = { ...payload, user_id: user.id };
      if (payload.id) {
        const { data, error } = await supabase
          .from("billing_entities")
          .update(row)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("billing_entities")
        .insert(row as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      inv(qc)();
      toast.success("Billing entity saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("billing_entities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      inv(qc)();
      toast.success("Deleted");
    },
  });

  return { entities: list.data ?? [], isLoading: list.isLoading, upsert, remove };
}

// ---------- Customers ----------
export function useCustomers() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["invoicing", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<Customer> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const row = { ...payload, user_id: user.id };
      if (payload.id) {
        const { data, error } = await supabase
          .from("customers")
          .update(row)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("customers")
        .insert(row as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      inv(qc)();
      toast.success("Customer saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      inv(qc)();
      toast.success("Deleted");
    },
  });

  return { customers: list.data ?? [], isLoading: list.isLoading, upsert, remove };
}

// ---------- Invoices ----------
export function useInvoices() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["invoicing", "invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("invoice_date", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<Invoice> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const row = { ...payload, user_id: user.id };
      if (payload.id) {
        const { data, error } = await supabase
          .from("invoices")
          .update(row)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data as Invoice;
      }
      const { data, error } = await supabase
        .from("invoices")
        .insert(row as any)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => inv(qc)(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      inv(qc)();
      toast.success("Invoice deleted");
    },
  });

  return { invoices: list.data ?? [], isLoading: list.isLoading, upsert, remove };
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ["invoicing", "invoice", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId!)
        .single();
      if (error) throw error;
      const { data: items, error: itemsErr } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("position", { ascending: true });
      if (itemsErr) throw itemsErr;
      const { data: payments } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("paid_on", { ascending: false });
      return {
        invoice: invoice as Invoice,
        items: (items ?? []) as InvoiceItem[],
        payments: (payments ?? []) as InvoicePayment[],
      };
    },
  });
}

export function useInvoiceItemsMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["invoicing"] });

  const replaceAll = useMutation({
    mutationFn: async ({
      invoiceId,
      items,
    }: {
      invoiceId: string;
      items: Array<Partial<InvoiceItem>>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      // Wipe then insert (small list)
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      if (items.length === 0) return [];
      const rows = items.map((it, idx) => ({
        invoice_id: invoiceId,
        user_id: user.id,
        position: idx,
        service: it.service ?? null,
        description: it.description ?? null,
        meta: it.meta ?? null,
        qty: Number(it.qty ?? 0),
        rate: Number(it.rate ?? 0),
        amount: Number(it.qty ?? 0) * Number(it.rate ?? 0),
      }));
      const { data, error } = await supabase.from("invoice_items").insert(rows).select();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  return { replaceAll };
}

export function useInvoicePayments() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async (p: Partial<InvoicePayment> & { invoice_id: string; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("invoice_payments")
        .insert({ ...p, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoicing"] });
      toast.success("Payment recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoice_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoicing"] }),
  });
  return { add, remove };
}

export function useBankReceipts() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["invoicing", "bank_receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_receipts")
        .select("*")
        .order("posted_on", { ascending: false });
      if (error) throw error;
      return data as BankReceipt[];
    },
  });

  const bulkInsert = useMutation({
    mutationFn: async (rows: Array<Partial<BankReceipt>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = rows.map((r) => ({ ...r, user_id: user.id }));
      const { data, error } = await supabase
        .from("bank_receipts")
        .upsert(payload as any, { onConflict: "user_id,source,external_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoicing"] });
      toast.success("Receipts imported");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BankReceipt> & { id: string }) => {
      const { data, error } = await supabase
        .from("bank_receipts")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoicing"] }),
  });

  return { receipts: list.data ?? [], isLoading: list.isLoading, bulkInsert, update };
}

// helper: format currency for invoice screens
export function fmtMoney(value: number, currency = "GBP") {
  const symbol: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };
  return `${symbol[currency] ?? ""}${(Number(value) || 0).toFixed(2)}`;
}
