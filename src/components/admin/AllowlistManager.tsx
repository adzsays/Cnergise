import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type AllowedEmail = {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
};

export function AllowlistManager() {
  const [items, setItems] = useState<AllowedEmail[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("allowed_emails" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("allowed_emails" as any)
      .insert({ email: email.trim().toLowerCase(), note: note || null, created_by: user?.id });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Email added to allowlist");
    setEmail("");
    setNote("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("allowed_emails" as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Removed from allowlist");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailPlus className="h-5 w-5" />
          Invite Allowlist
        </CardTitle>
        <CardDescription>
          Stealth mode is on. Only emails on this list can sign up or sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button onClick={add} disabled={loading || !email.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  No invites yet. Add an email above to grant access.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.email}</TableCell>
                  <TableCell className="text-muted-foreground">{row.note || "—"}</TableCell>
                  <TableCell>{format(new Date(row.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(row.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
