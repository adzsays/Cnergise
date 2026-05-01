import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyAgreement } from "@/hooks/useFeatures";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_LABEL: Record<string, string> = {
  feature_enabled: "Feature enabled",
  feature_disabled: "Feature disabled",
  terms_accepted: "Terms accepted",
  agreement_signed: "Agreement signed",
  admin_approved: "Approved by admin",
  admin_rejected: "Rejected by admin",
  admin_revoked: "Revoked by admin",
};

export function ConsentHistory() {
  const { data: agreement } = useMyAgreement();

  const { data: log = [] } = useQuery({
    queryKey: ["my-consent-log"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("consent_audit_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Master Service Agreement</CardTitle>
          <CardDescription>Your signed terms of use.</CardDescription>
        </CardHeader>
        <CardContent>
          {agreement ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div><span className="text-muted-foreground">Version:</span> v{agreement.agreement_version}</div>
                <div><span className="text-muted-foreground">Signed:</span> {format(new Date(agreement.signed_at), "PPp")}</div>
              </div>
              <div className="text-xs text-muted-foreground break-all">
                Signature hash: <code>{agreement.signature_hash}</code>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(agreement.selected_features as string[]).map((f) => (
                  <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                ))}
              </div>
              {agreement.pdf_url && (
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <a href={agreement.pdf_url} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5 mr-1" /> Download PDF</a>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No agreement on file yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent & audit history</CardTitle>
          <CardDescription>An immutable record of every consent action on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {log.map((e: any) => (
                <div key={e.id} className="flex items-start justify-between gap-3 py-2 border-b text-sm last:border-0">
                  <div>
                    <div className="font-medium">{ACTION_LABEL[e.action] ?? e.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.feature_key ? `${e.feature_key} · ` : ""}{format(new Date(e.created_at), "PPp")}
                      {e.terms_version ? ` · v${e.terms_version}` : ""}
                    </div>
                  </div>
                  {e.ip_address && <span className="text-xs text-muted-foreground">{e.ip_address}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
