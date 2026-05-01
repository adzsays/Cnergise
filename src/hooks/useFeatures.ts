import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppFeature = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: "core" | "standard" | "regulated";
  route: string | null;
  icon: string | null;
  is_core: boolean;
  is_regulated: boolean;
  requires_approval: boolean;
  disclaimer: string | null;
  current_terms_version: string;
  sort_order: number;
  is_available: boolean;
};

export type UserFeatureSubscription = {
  id: string;
  user_id: string;
  feature_key: string;
  status: "pending_approval" | "active" | "suspended" | "revoked";
  accepted_terms_version: string | null;
  accepted_at: string | null;
};

export function useAppFeatures() {
  return useQuery({
    queryKey: ["app-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_features")
        .select("*")
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data as AppFeature[];
    },
  });
}

export function useMySubscriptions() {
  return useQuery({
    queryKey: ["my-feature-subscriptions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as UserFeatureSubscription[];
      const { data, error } = await supabase
        .from("user_feature_subscriptions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as UserFeatureSubscription[];
    },
  });
}

export function useMyAgreement() {
  return useQuery({
    queryKey: ["my-agreement"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_agreements")
        .select("*")
        .eq("user_id", user.id)
        .order("signed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

async function getClientMetadata() {
  let ip = "unknown";
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const json = await res.json();
    ip = json.ip;
  } catch {
    // ignore
  }
  return { ip, ua: navigator.userAgent };
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function useEnableFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ feature, notes }: { feature: AppFeature; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const meta = await getClientMetadata();
      const status = feature.requires_approval ? "pending_approval" : "active";

      const { error: subErr } = await supabase
        .from("user_feature_subscriptions")
        .upsert({
          user_id: user.id,
          feature_key: feature.key,
          status,
          accepted_terms_version: feature.current_terms_version,
          accepted_at: new Date().toISOString(),
        }, { onConflict: "user_id,feature_key" });
      if (subErr) throw subErr;

      await supabase.from("consent_audit_log").insert({
        user_id: user.id,
        feature_key: feature.key,
        action: "feature_enabled",
        terms_version: feature.current_terms_version,
        ip_address: meta.ip,
        user_agent: meta.ua,
        signature_hash: await sha256(`${user.id}:${feature.key}:${feature.current_terms_version}:${Date.now()}`),
        payload: { disclaimer: feature.disclaimer, notes: notes ?? null },
      });

      if (feature.requires_approval) {
        await supabase.from("feature_approval_queue").insert({
          user_id: user.id,
          feature_key: feature.key,
          status: "pending",
          user_notes: notes ?? null,
        });
      }

      return { status };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: ["my-feature-subscriptions"] });
      if (result.status === "pending_approval") {
        toast.success(`${vars.feature.name} requested. Pending admin approval.`);
      } else {
        toast.success(`${vars.feature.name} enabled.`);
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to enable feature"),
  });
}

export function useDisableFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (feature: AppFeature) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const meta = await getClientMetadata();

      const { error } = await supabase
        .from("user_feature_subscriptions")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("feature_key", feature.key);
      if (error) throw error;

      await supabase.from("consent_audit_log").insert({
        user_id: user.id,
        feature_key: feature.key,
        action: "feature_disabled",
        ip_address: meta.ip,
        user_agent: meta.ua,
        payload: {},
      });
    },
    onSuccess: (_d, feature) => {
      qc.invalidateQueries({ queryKey: ["my-feature-subscriptions"] });
      toast.success(`${feature.name} disabled.`);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to disable feature"),
  });
}

export function useSignAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ selectedFeatures, version = "1.0.0" }: { selectedFeatures: string[]; version?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const meta = await getClientMetadata();
      const signature = await sha256(`${user.id}:${version}:${selectedFeatures.sort().join(",")}:${Date.now()}`);

      const { data, error } = await supabase
        .from("user_agreements")
        .insert({
          user_id: user.id,
          agreement_version: version,
          signature_hash: signature,
          selected_features: selectedFeatures,
          ip_address: meta.ip,
          user_agent: meta.ua,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("consent_audit_log").insert({
        user_id: user.id,
        action: "agreement_signed",
        terms_version: version,
        ip_address: meta.ip,
        user_agent: meta.ua,
        signature_hash: signature,
        payload: { selected_features: selectedFeatures },
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-agreement"] });
      qc.invalidateQueries({ queryKey: ["my-feature-subscriptions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to sign agreement"),
  });
}

export function hasActiveAccess(
  feature: AppFeature,
  subs: UserFeatureSubscription[] | undefined,
): { active: boolean; status: UserFeatureSubscription["status"] | "not_enabled" } {
  if (feature.is_core) return { active: true, status: "active" };
  const sub = subs?.find((s) => s.feature_key === feature.key);
  if (!sub) return { active: false, status: "not_enabled" };
  return { active: sub.status === "active", status: sub.status };
}
