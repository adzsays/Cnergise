import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

type Row = {
  id: string;
  user_id: string;
  feature_key: string;
  status: string;
  user_notes: string | null;
  created_at: string;
};

export function ApprovalQueue() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["feature-approval-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_approval_queue")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Row[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ row, approve }: { row: Row; approve: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const reviewerNotes = notes[row.id] || null;

      // 1. Update queue row
      const { error: qErr } = await supabase
        .from("feature_approval_queue")
        .update({
          status: approve ? "approved" : "rejected",
          reviewer_notes: reviewerNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (qErr) throw qErr;

      // 2. Update subscription
      const { error: sErr } = await supabase
        .from("user_feature_subscriptions")
        .update({
          status: approve ? "active" : "revoked",
          approved_by: approve ? user.id : null,
          approved_at: approve ? new Date().toISOString() : null,
          revoked_at: approve ? null : new Date().toISOString(),
          revoke_reason: approve ? null : (reviewerNotes ?? "Rejected by admin"),
        })
        .eq("user_id", row.user_id)
        .eq("feature_key", row.feature_key);
      if (sErr) throw sErr;

      // 3. Audit log
      await supabase.from("consent_audit_log").insert({
        user_id: row.user_id,
        feature_key: row.feature_key,
        action: approve ? "admin_approved" : "admin_rejected",
        performed_by: user.id,
        payload: { reviewer_notes: reviewerNotes },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-approval-queue"] });
      toast.success("Decision recorded");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-500" /> Regulated feature approvals</CardTitle>
        <CardDescription>Review and approve user requests to enable regulated modules.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {queue.map((row) => (
              <div key={row.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Badge variant="default" className="mb-1">{row.feature_key}</Badge>
                    <p className="text-xs text-muted-foreground">User: {row.user_id.slice(0, 8)}… · {format(new Date(row.created_at), "PPp")}</p>
                  </div>
                </div>
                {row.user_notes && (
                  <p className="text-sm bg-muted p-2 rounded">User notes: {row.user_notes}</p>
                )}
                <Textarea
                  placeholder="Reviewer notes (optional)"
                  value={notes[row.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => decide.mutate({ row, approve: false })} disabled={decide.isPending}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => decide.mutate({ row, approve: true })} disabled={decide.isPending}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
