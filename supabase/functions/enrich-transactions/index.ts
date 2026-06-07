// Deep enrichment for unmapped bank transactions.
// Returns a PROPOSAL — no DB writes happen here.
// The UI shows the summary; user confirms; apply-enrichment-summary persists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalize = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

type Txn = {
  id: string;
  posted_on: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  account_provider: string | null;
  account_name: string | null;
};

type Cashflow = {
  id: string;
  type: string;
  category: string;
  subcategory: string;
  cost_centre: string | null;
  group_name: string;
};

type CashSection = "operating" | "investing" | "financing";

type Proposal = {
  txn_id: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  posted_on: string;
  cashflow_id: string | null;
  new_cashflow?: {
    type: "income" | "expense";
    category: string;
    subcategory: string;
    cost_centre: string | null;
    cash_flow_section?: CashSection;
  };
  classification: string;
  reason: string;
  source: "transfer" | "keyword" | "ai-web" | "ai";
  confidence: number;
  rule?: {
    match_type: "description_contains" | "merchant" | "description_exact";
    match_value: string;
  };
  paired_txn_id?: string;
};

const KEYWORD_RULES: { test: RegExp; cat: string; sub: string; type: "income" | "expense"; section?: CashSection; reason: string }[] = [
  { test: /\b(late fee|overdraft|penalty|nsf)\b/i, cat: "Bank Charges", sub: "Late Fee / Penalty", type: "expense", reason: "Late fee / penalty keyword" },
  { test: /\b(bank charge|service charge|monthly fee|account fee)\b/i, cat: "Bank Charges", sub: "Service Charge", type: "expense", reason: "Bank service charge" },
  { test: /\b(salary|payroll|wages)\b/i, cat: "Income", sub: "Salary", type: "income", reason: "Salary / payroll" },
  { test: /\b(dividend)\b/i, cat: "Income", sub: "Dividend", type: "income", reason: "Dividend payment" },
  { test: /\b(refund|reversal|chargeback)\b/i, cat: "Refunds", sub: "Refund", type: "income", reason: "Refund / reversal" },
  { test: /\b(atm|cash withdrawal)\b/i, cat: "Cash", sub: "ATM Withdrawal", type: "expense", reason: "ATM withdrawal" },
  // Investing — securities & crypto contributions
  { test: /\b(vanguard|fidelity|schwab|robinhood|hargreaves|trading\s*212|etoro|interactive\s*brokers|ibkr|coinbase|kraken|binance|nutmeg|moneybox|freetrade)\b/i, cat: "Investments", sub: "Brokerage Contribution", type: "expense", section: "investing", reason: "Transfer to brokerage / crypto exchange" },
  { test: /\b(isa|sipp|pension contribution|share purchase|stock purchase|etf|ishares|index fund|mutual fund)\b/i, cat: "Investments", sub: "Securities Purchase", type: "expense", section: "investing", reason: "Securities / pension contribution" },
  // Financing — debt service
  { test: /\b(mortgage|home loan)\b/i, cat: "Debt Service", sub: "Mortgage Payment", type: "expense", section: "financing", reason: "Mortgage payment" },
  { test: /\b(loan payment|car finance|hp finance|hire purchase|personal loan)\b/i, cat: "Debt Service", sub: "Loan Repayment", type: "expense", section: "financing", reason: "Loan repayment" },
  { test: /\b(credit card payment|cc payment|amex payment|visa payment|mastercard payment)\b/i, cat: "Debt Service", sub: "Credit Card Payment", type: "expense", section: "financing", reason: "Credit card paydown" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Load unmapped txns + cashflow lines
    const [{ data: txnsRaw }, { data: cashflowsRaw }] = await Promise.all([
      supabase
        .from("actual_expenses")
        .select("id, posted_on, merchant, description, amount, account_provider, account_name")
        .eq("user_id", user.id)
        .is("mapped_cashflow_id", null)
        .order("posted_on", { ascending: false })
        .limit(300),
      supabase
        .from("financial_transactions")
        .select("id, type, category, subcategory, cost_centre, group_name")
        .eq("user_id", user.id),
    ]);

    const txns = (txnsRaw || []) as Txn[];
    const cashflows = (cashflowsRaw || []) as Cashflow[];

    if (txns.length === 0) {
      return new Response(JSON.stringify({ proposals: [], summary: { total: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const proposals: Proposal[] = [];
    const handled = new Set<string>();

    // Helper: find existing cashflow by category/subcategory + type
    const findExistingCashflow = (type: "income" | "expense", subOrCat: string): Cashflow | null => {
      const target = normalize(subOrCat);
      return (
        cashflows.find((c) => c.type === type && normalize(c.subcategory) === target) ||
        cashflows.find((c) => c.type === type && normalize(c.category) === target) ||
        cashflows.find((c) => c.type === type && normalize(c.subcategory).includes(target)) ||
        null
      );
    };

    // 2. TRANSFER detection: same |amount| within 3 days, opposite signs, different account
    for (let i = 0; i < txns.length; i++) {
      const a = txns[i];
      if (handled.has(a.id)) continue;
      for (let j = i + 1; j < txns.length; j++) {
        const b = txns[j];
        if (handled.has(b.id)) continue;
        if (Math.abs(Number(a.amount) + Number(b.amount)) > 0.01) continue;
        const dA = new Date(a.posted_on).getTime();
        const dB = new Date(b.posted_on).getTime();
        if (Math.abs(dA - dB) > 3 * 86400_000) continue;
        const accA = (a.account_name || a.account_provider || "").trim();
        const accB = (b.account_name || b.account_provider || "").trim();
        if (accA && accB && accA === accB) continue; // same account, not a transfer

        // Both look like a transfer
        const transferLine = findExistingCashflow("expense", "Transfer") || findExistingCashflow("income", "Transfer");
        const newCashflow = transferLine ? undefined : {
          type: "expense" as const,
          category: "Transfers",
          subcategory: "Account Transfer",
          cost_centre: null,
        };
        for (const t of [a, b]) {
          proposals.push({
            txn_id: t.id,
            merchant: t.merchant,
            description: t.description,
            amount: Number(t.amount),
            posted_on: t.posted_on,
            cashflow_id: transferLine?.id ?? null,
            new_cashflow: newCashflow,
            classification: "Inter-account transfer",
            reason: `Matched ${t === a ? "outflow" : "inflow"} of ${Math.abs(Number(t.amount))} on ${t.posted_on} with opposite leg on ${t === a ? b.posted_on : a.posted_on}`,
            source: "transfer",
            confidence: 0.95,
            paired_txn_id: t === a ? b.id : a.id,
          });
        }
        handled.add(a.id);
        handled.add(b.id);
        break;
      }
    }

    // 3. KEYWORD rules + interest sign logic
    for (const t of txns) {
      if (handled.has(t.id)) continue;
      const text = `${t.merchant ?? ""} ${t.description ?? ""}`;
      let matched: { cat: string; sub: string; type: "income" | "expense"; section?: CashSection; reason: string } | null = null;

      if (/\binterest\b/i.test(text)) {
        if (Number(t.amount) > 0) {
          matched = { cat: "Income", sub: "Interest Income", type: "income", section: "operating", reason: "Positive amount + 'interest' → interest income" };
        } else {
          matched = { cat: "Interest", sub: "Interest Expense", type: "expense", section: "operating", reason: "Negative amount + 'interest' → interest expense" };
        }
      } else {
        for (const r of KEYWORD_RULES) {
          if (r.test.test(text)) {
            matched = { cat: r.cat, sub: r.sub, type: r.type, section: r.section, reason: r.reason };
            break;
          }
        }
      }
      if (!matched) continue;

      const existing = findExistingCashflow(matched.type, matched.sub) || findExistingCashflow(matched.type, matched.cat);
      proposals.push({
        txn_id: t.id,
        merchant: t.merchant,
        description: t.description,
        amount: Number(t.amount),
        posted_on: t.posted_on,
        cashflow_id: existing?.id ?? null,
        new_cashflow: existing
          ? undefined
          : { type: matched.type, category: matched.cat, subcategory: matched.sub, cost_centre: null, cash_flow_section: matched.section ?? "operating" },
        classification: `${matched.cat} — ${matched.sub}`,
        reason: matched.reason,
        source: "keyword",
        confidence: 0.9,
        rule: {
          match_type: "description_contains",
          match_value: matched.sub.toLowerCase(),
        },
      });
      handled.add(t.id);
    }

    // 4. AI merchant classification via Lovable AI (Gemini) — for residual txns
    const residual = txns.filter((t) => !handled.has(t.id));
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const buckets = new Map<string, Txn[]>();
    for (const t of residual) {
      const key = normalize(t.merchant || t.description || "").slice(0, 60);
      if (!key) continue;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(t);
    }

    const cashflowCatalog = cashflows.map((c) => `- ${c.type}: ${c.category} / ${c.subcategory}`).join("\n");

    const merchantKeys = Array.from(buckets.keys()).slice(0, 25);
    for (const key of merchantKeys) {
      const group = buckets.get(key)!;
      const sample = group[0];
      const isExpense = Number(sample.amount) < 0;
      let cat = "Uncategorized";
      let sub = "Uncategorized";
      let section: CashSection = "operating";
      let reason = "Heuristic";
      let conf = 0.4;
      let usedAi = false;

      if (lovableKey) {
        try {
          const prompt = `Classify this bank transaction.

Merchant/description: "${sample.merchant ?? sample.description ?? key}"
Direction: ${isExpense ? "debit (money out)" : "credit (money in)"}

Existing budget lines available:
${cashflowCatalog || "(none yet)"}

Pick the BEST category, a concise subcategory, and the cash-flow section.
- operating = day-to-day income/expenses (food, utilities, salary, subscriptions, interest)
- investing = buying or selling assets that create/dispose of an investment (stocks, ETFs, crypto, property, equipment >£500)
- financing = movements that change debt or equity (loan principal, credit-card paydown, mortgage principal, dividends paid out)`;

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a precise financial classifier. Always call the provided tool." },
                { role: "user", content: prompt },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "classify_merchant",
                  description: "Return classification for the merchant",
                  parameters: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      subcategory: { type: "string" },
                      cash_flow_section: { type: "string", enum: ["operating", "investing", "financing"] },
                      reason: { type: "string" },
                    },
                    required: ["category", "subcategory", "cash_flow_section", "reason"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "classify_merchant" } },
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
            if (args) {
              const parsed = JSON.parse(args);
              cat = parsed.category || cat;
              sub = parsed.subcategory || sub;
              section = (parsed.cash_flow_section as CashSection) || "operating";
              reason = parsed.reason || "AI classification";
              conf = 0.75;
              usedAi = true;
            }
          } else {
            console.warn("Lovable AI error", resp.status, await resp.text());
          }
        } catch (e) {
          console.warn("Lovable AI call failed", e);
        }
      }

      const type: "income" | "expense" = isExpense ? "expense" : "income";
      const existing = findExistingCashflow(type, sub) || findExistingCashflow(type, cat);
      const ruleValue = (sample.merchant || sample.description || key).toString().trim().slice(0, 60).toLowerCase();

      for (const t of group) {
        proposals.push({
          txn_id: t.id,
          merchant: t.merchant,
          description: t.description,
          amount: Number(t.amount),
          posted_on: t.posted_on,
          cashflow_id: existing?.id ?? null,
          new_cashflow: existing ? undefined : { type, category: cat, subcategory: sub, cost_centre: null, cash_flow_section: section },
          classification: `${cat} — ${sub}`,
          reason,
          source: usedAi ? "ai-web" : "ai",
          confidence: conf,
          rule: {
            match_type: "description_contains",
            match_value: ruleValue,
          },
        });
        handled.add(t.id);
      }
    }

    // 5. Build summary
    const newCashflowMap = new Map<string, { type: string; category: string; subcategory: string; count: number }>();
    for (const p of proposals) {
      if (p.new_cashflow) {
        const k = `${p.new_cashflow.type}::${p.new_cashflow.category}::${p.new_cashflow.subcategory}`;
        const cur = newCashflowMap.get(k) || { ...p.new_cashflow, count: 0 };
        cur.count++;
        newCashflowMap.set(k, cur);
      }
    }

    return new Response(
      JSON.stringify({
        proposals,
        summary: {
          total: txns.length,
          proposed: proposals.length,
          transfers: proposals.filter((p) => p.source === "transfer").length,
          keyword: proposals.filter((p) => p.source === "keyword").length,
          ai: proposals.filter((p) => p.source === "ai" || p.source === "ai-web").length,
          unhandled: txns.length - handled.size,
          new_cashflow_lines: Array.from(newCashflowMap.values()),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("enrich-transactions error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
