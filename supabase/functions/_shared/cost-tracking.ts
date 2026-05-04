// Shared helper to log service usage events for cost tracking.
// Safe to call from any edge function — never throws.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type LogArgs = {
  service: string;            // e.g. "lovable-ai", "perplexity", "edge-function"
  operation?: string;         // e.g. model name, "sonar", "invocation"
  units?: number;             // tokens, calls, GB, etc.
  function_name?: string;     // calling edge function
  user_id?: string | null;
  metadata?: Record<string, unknown>;
};

let cachedClient: ReturnType<typeof createClient> | null = null;
const priceCache = new Map<string, { unit_cost: number; currency: string; ts: number }>();
const PRICE_TTL_MS = 5 * 60 * 1000;

function getClient() {
  if (cachedClient) return cachedClient;
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

async function getPrice(service: string, operation: string) {
  const cacheKey = `${service}::${operation}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PRICE_TTL_MS) return cached;
  const supa = getClient();
  let { data } = await supa
    .from("service_pricing")
    .select("unit_cost,currency")
    .eq("service", service)
    .eq("operation", operation)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) {
    const fb = await supa
      .from("service_pricing")
      .select("unit_cost,currency")
      .eq("service", service)
      .eq("operation", "default")
      .eq("is_active", true)
      .maybeSingle();
    data = fb.data;
  }
  const result = {
    unit_cost: Number(data?.unit_cost ?? 0),
    currency: (data?.currency as string) ?? "GBP",
    ts: Date.now(),
  };
  priceCache.set(cacheKey, result);
  return result;
}

export async function logServiceUsage(args: LogArgs): Promise<void> {
  try {
    const operation = args.operation ?? "default";
    const units = Number(args.units ?? 1);
    const { unit_cost, currency } = await getPrice(args.service, operation);
    const total_cost = unit_cost * units;
    await getClient().from("service_usage_events").insert({
      service: args.service,
      operation,
      units,
      unit_cost,
      total_cost,
      currency,
      function_name: args.function_name ?? null,
      user_id: args.user_id ?? null,
      metadata: args.metadata ?? {},
    });
  } catch (e) {
    console.error("[cost-tracking] failed:", (e as Error).message);
  }
}
