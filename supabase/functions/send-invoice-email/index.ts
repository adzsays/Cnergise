import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { invoiceId } = await req.json();
    if (!invoiceId) return new Response(JSON.stringify({ error: "invoiceId required" }), { status: 400, headers: corsHeaders });

    const { data: invoice, error: invErr } = await supabase
      .from("invoices").select("*").eq("id", invoiceId).eq("user_id", user.id).single();
    if (invErr || !invoice) return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: corsHeaders });

    // Look up customer email
    let toEmail: string | null = null;
    if (invoice.customer_id) {
      const { data: c } = await supabase.from("customers").select("email").eq("id", invoice.customer_id).single();
      toEmail = c?.email ?? null;
    }
    if (!toEmail) {
      return new Response(JSON.stringify({ error: "Customer has no email" }), { status: 400, headers: corsHeaders });
    }

    const subject = invoice.email_subject || `Invoice ${invoice.invoice_number} from ${invoice.seller_name ?? ""}`;
    const body = invoice.email_body ||
      `Hi ${invoice.client_name},\n\nPlease find invoice ${invoice.invoice_number} for ${invoice.currency} ${invoice.total} due on ${invoice.due_date}.\n\n${invoice.payment_link ? `Pay: ${invoice.payment_link}\n\n` : ""}Thanks,\n${invoice.seller_name}`;

    // Persist a draft email row so the user sees it in Mail (real send requires connected mailbox).
    await supabase.from("emails").insert({
      user_id: user.id,
      to_email: toEmail,
      from_email: invoice.seller_name ?? null,
      subject,
      body,
      status: "queued",
      space_id: invoice.space_id,
    });

    // Mark invoice as sent
    await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoiceId);

    return new Response(
      JSON.stringify({ ok: true, message: `Invoice queued to ${toEmail}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-invoice-email error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
