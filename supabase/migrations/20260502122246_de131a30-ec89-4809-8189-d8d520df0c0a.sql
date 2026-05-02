
-- =========================================================
-- INVOICING MODULE — Customers, Billing entities, Invoices,
-- Invoice items, Payments, Bank receipts (for reconciliation)
-- =========================================================

-- ---------- Billing entities (sender) ----------
CREATE TABLE public.billing_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  address_lines text,            -- multi-line free text (matches PDF)
  logo_url text,
  bank_details text,             -- multi-line payout block
  default_payment_provider text,
  default_payment_link text,
  default_terms text DEFAULT 'Due on receipt',
  default_currency text NOT NULL DEFAULT 'GBP',
  default_vat_rate numeric NOT NULL DEFAULT 0,
  invoice_number_prefix text,
  next_invoice_seq integer NOT NULL DEFAULT 1,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own billing entities — select" ON public.billing_entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own billing entities — insert" ON public.billing_entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own billing entities — update" ON public.billing_entities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own billing entities — delete" ON public.billing_entities FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_billing_entities_updated BEFORE UPDATE ON public.billing_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Customers ----------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address_lines text,
  tax_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers — select" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own customers — insert" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own customers — update" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own customers — delete" ON public.customers FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Invoices ----------
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  billing_entity_id uuid REFERENCES public.billing_entities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  space_id uuid,
  project_id uuid,
  cost_centre text,
  -- Snapshots so the invoice never changes if customer/entity are edited later
  invoice_number text NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  terms text,
  -- snapshot fields (frozen)
  seller_name text,
  seller_address_lines text,
  seller_bank_details text,
  client_name text,
  client_address_lines text,
  -- totals
  subtotal numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  other_charge numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance_due numeric NOT NULL DEFAULT 0,
  -- workflow
  status text NOT NULL DEFAULT 'draft', -- draft | sent | viewed | partial | paid | overdue | void
  payment_provider text,
  payment_link text,
  email_subject text,
  email_body text,
  notes text,
  expected_payment_days integer DEFAULT 7,
  sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, invoice_number)
);
CREATE INDEX idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_project ON public.invoices(project_id);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoices — select" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoices — insert" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own invoices — update" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoices — delete" ON public.invoices FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Invoice items ----------
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  service text,
  description text,
  meta text,                     -- left-side note (e.g. "Week 4 / 25, 26")
  qty numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoice items — select" ON public.invoice_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice items — insert" ON public.invoice_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice items — update" ON public.invoice_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice items — delete" ON public.invoice_items FOR DELETE USING (auth.uid() = user_id);

-- ---------- Invoice payments (manual / matched) ----------
CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  method text,                  -- bank_transfer | card | cash | other
  reference text,               -- bank reference / payer name
  bank_receipt_id uuid,         -- link to bank_receipts when matched
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoice payments — select" ON public.invoice_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice payments — insert" ON public.invoice_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice payments — update" ON public.invoice_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice payments — delete" ON public.invoice_payments FOR DELETE USING (auth.uid() = user_id);

-- ---------- Bank receipts (CSV/Excel/Finexer feed) ----------
CREATE TABLE public.bank_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'csv', -- csv | excel | finexer | manual
  external_id text,
  posted_on date NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  description text,
  counterparty text,
  reference text,
  matched_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  match_status text NOT NULL DEFAULT 'unmatched', -- unmatched | suggested | matched | ignored
  match_confidence numeric,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, external_id)
);
CREATE INDEX idx_bank_receipts_user_status ON public.bank_receipts(user_id, match_status);
CREATE INDEX idx_bank_receipts_invoice ON public.bank_receipts(matched_invoice_id);
ALTER TABLE public.bank_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bank receipts — select" ON public.bank_receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bank receipts — insert" ON public.bank_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own bank receipts — update" ON public.bank_receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bank receipts — delete" ON public.bank_receipts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_bank_receipts_updated BEFORE UPDATE ON public.bank_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Recompute invoice totals on payment changes ----------
CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv_id uuid;
  paid numeric;
  total_v numeric;
  status_v text;
  due_v date;
BEGIN
  inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount),0) INTO paid FROM public.invoice_payments WHERE invoice_id = inv_id;
  SELECT total, due_date, status INTO total_v, due_v, status_v FROM public.invoices WHERE id = inv_id;
  IF total_v IS NULL THEN
    RETURN NEW;
  END IF;
  IF paid >= total_v AND total_v > 0 THEN
    status_v := 'paid';
  ELSIF paid > 0 THEN
    status_v := 'partial';
  ELSIF due_v IS NOT NULL AND due_v < CURRENT_DATE THEN
    status_v := CASE WHEN status_v IN ('draft') THEN status_v ELSE 'overdue' END;
  END IF;
  UPDATE public.invoices
    SET amount_paid = paid,
        balance_due = GREATEST(total_v - paid, 0),
        status = status_v,
        paid_at = CASE WHEN status_v = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END
    WHERE id = inv_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_payments_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();

-- ---------- Add 'invoicing' module to feature catalog ----------
INSERT INTO public.app_features (key, name, description, category, route, icon, is_core, is_available, sort_order)
VALUES ('invoicing', 'Invoicing', 'Create branded invoices, track outstanding receivables, and reconcile payments.', 'standard', '/invoices', 'FileText', false, true, 55)
ON CONFLICT (key) DO NOTHING;
