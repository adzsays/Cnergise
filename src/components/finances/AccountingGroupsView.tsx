import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FolderTree, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fmtMoney } from "@/hooks/useInvoicing";
import { useSpaces } from "@/hooks/useSpaces";

type Group = { id: string; name: string; description: string | null; color: string | null };
type Member = { id: string; group_id: string; member_type: "cost_centre" | "space"; member_value: string };
type Expense = { id: string; amount: number; currency: string; category: string | null; space_id: string | null; posted_on: string };

export function AccountingGroupsView() {
  const qc = useQueryClient();
  const { spaces } = useSpaces();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [memberOpen, setMemberOpen] = useState<string | null>(null);
  const [memberType, setMemberType] = useState<"cost_centre" | "space">("cost_centre");
  const [memberValue, setMemberValue] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["expense_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_groups" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Group[];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["expense_group_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_group_members" as any).select("*");
      if (error) throw error;
      return (data ?? []) as unknown as Member[];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["actual_expenses_for_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actual_expenses" as any)
        .select("id,amount,currency,category,space_id,posted_on")
        .order("posted_on", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as Expense[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [expenses]);

  const createGroup = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not signed in");
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("expense_groups" as any).insert({
        user_id: user.id,
        name: name.trim(),
        description: desc.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense_groups"] });
      toast.success("Group created");
      setOpen(false);
      setName("");
      setDesc("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_groups" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense_groups"] });
      qc.invalidateQueries({ queryKey: ["expense_group_members"] });
    },
  });

  const addMember = useMutation({
    mutationFn: async (groupId: string) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not signed in");
      if (!memberValue) throw new Error("Pick a value");
      const { error } = await supabase.from("expense_group_members" as any).insert({
        group_id: groupId,
        user_id: user.id,
        member_type: memberType,
        member_value: memberValue,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense_group_members"] });
      setMemberValue("");
      setMemberOpen(null);
      toast.success("Added");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_group_members" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense_group_members"] }),
  });

  // Compute totals per group based on actual_expenses
  const groupTotals = useMemo(() => {
    const map: Record<string, { inflow: number; outflow: number; count: number; currency: string }> = {};
    for (const g of groups) {
      const ms = members.filter((m) => m.group_id === g.id);
      const cats = new Set(ms.filter((m) => m.member_type === "cost_centre").map((m) => m.member_value));
      const spc = new Set(ms.filter((m) => m.member_type === "space").map((m) => m.member_value));
      let inflow = 0, outflow = 0, count = 0, currency = "GBP";
      for (const e of expenses) {
        const matchCat = e.category && cats.has(e.category);
        const matchSpace = e.space_id && spc.has(e.space_id);
        if (matchCat || matchSpace) {
          count++;
          currency = e.currency || currency;
          if (Number(e.amount) >= 0) inflow += Number(e.amount);
          else outflow += Number(e.amount);
        }
      }
      map[g.id] = { inflow, outflow, count, currency };
    }
    return map;
  }, [groups, members, expenses]);

  const spaceName = (id: string) => spaces?.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><FolderTree className="h-4 w-4" /> Accounting groups</h3>
          <p className="text-sm text-muted-foreground">
            Roll up actual expenses by Group. A Group can include one or many cost centres (categories) and/or Spaces.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create accounting group</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Operations" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createGroup.mutate()} disabled={createGroup.isPending}>
                {createGroup.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-6 text-center">Loading…</div>
      ) : groups.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No groups yet. Create your first to start rolling up actual expenses.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.map((g) => {
            const ms = members.filter((m) => m.group_id === g.id);
            const t = groupTotals[g.id] ?? { inflow: 0, outflow: 0, count: 0, currency: "GBP" };
            return (
              <Card key={g.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{g.name}</div>
                    {g.description && <div className="text-xs text-muted-foreground">{g.description}</div>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteGroup.mutate(g.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Inflow</div>
                    <div className="text-sm font-semibold tabular-nums text-green-600">{fmtMoney(t.inflow, t.currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Outflow</div>
                    <div className="text-sm font-semibold tabular-nums text-destructive">{fmtMoney(t.outflow, t.currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Net ({t.count})</div>
                    <div className="text-sm font-semibold tabular-nums">{fmtMoney(t.inflow + t.outflow, t.currency)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Members</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ms.length === 0 && <span className="text-xs text-muted-foreground italic">None yet</span>}
                    {ms.map((m) => (
                      <Badge key={m.id} variant={m.member_type === "space" ? "default" : "secondary"} className="gap-1">
                        {m.member_type === "space" ? `Space: ${spaceName(m.member_value)}` : m.member_value}
                        <button onClick={() => removeMember.mutate(m.id)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {memberOpen === g.id ? (
                  <div className="flex flex-wrap gap-2 items-end pt-2 border-t">
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] text-muted-foreground">Type</label>
                      <Select value={memberType} onValueChange={(v) => { setMemberType(v as any); setMemberValue(""); }}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cost_centre">Cost centre</SelectItem>
                          <SelectItem value="space">Space</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-[10px] text-muted-foreground">Value</label>
                      {memberType === "cost_centre" ? (
                        <Select value={memberValue} onValueChange={setMemberValue}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Choose category" /></SelectTrigger>
                          <SelectContent>
                            {categories.length === 0 && <SelectItem value="__none__" disabled>No categories yet</SelectItem>}
                            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={memberValue} onValueChange={setMemberValue}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Choose space" /></SelectTrigger>
                          <SelectContent>
                            {(spaces ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button size="sm" onClick={() => addMember.mutate(g.id)} disabled={addMember.isPending}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setMemberOpen(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setMemberOpen(g.id); setMemberType("cost_centre"); setMemberValue(""); }}>
                    <Plus className="h-3 w-3 mr-1" /> Add member
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
