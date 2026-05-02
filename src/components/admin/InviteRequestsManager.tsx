import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Inbox } from "lucide-react";
import { useState } from "react";

type InviteRequest = {
  id: string;
  email: string;
  full_name: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function InviteRequestsManager() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["invite-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invite_requests")
        .select("id,email,full_name,reason,status,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as InviteRequest[];
    },
  });

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase
      .from("invite_requests")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      status === "approved"
        ? "Approved — email added to allowlist"
        : "Request rejected"
    );
    qc.invalidateQueries({ queryKey: ["invite-requests"] });
    qc.invalidateQueries({ queryKey: ["allowed-emails"] });
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Invite requests
              {pending.length > 0 && (
                <Badge variant="default">{pending.length} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review who wants access. Approving adds the email to the allowlist so they can sign up.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invite requests yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.email}</TableCell>
                  <TableCell>{r.full_name ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                    {r.reason ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "approved"
                          ? "default"
                          : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() => updateStatus(r.id, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => updateStatus(r.id, "approved")}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
