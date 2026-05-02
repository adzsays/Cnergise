import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { Service, useServices, fmtMoney } from "@/hooks/useInvoicing";
import { useSpaces } from "@/hooks/useSpaces";
import { useProjects } from "@/hooks/useProjects";

export function ServiceManager() {
  const { services, isLoading, upsert, remove } = useServices();
  const { spaces } = useSpaces();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const startNew = () => {
    setEditing({
      name: "",
      description: "",
      default_rate: 0,
      default_qty: 1,
      unit: "hour",
      currency: "GBP",
      cost_centre: "",
      space_id: null,
      project_id: null,
      is_active: true,
    });
    setOpen(true);
  };

  const startEdit = (s: Service) => {
    setEditing(s);
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name) return;
    await upsert.mutateAsync(editing);
    setOpen(false);
  };

  const filteredProjects = projects.filter(
    (p) => !editing?.space_id || p.space_id === editing.space_id
  );

  const spaceName = (id?: string | null) => spaces.find((s) => s.id === id)?.name;
  const projectName = (id?: string | null) => projects.find((p) => p.id === id)?.name;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> Services</h3>
          <p className="text-xs text-muted-foreground">Reusable invoice lines linked to a Space, project and cost centre.</p>
        </div>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New service</Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : services.length === 0 ? (
        <div className="text-sm text-muted-foreground p-6 text-center border rounded-lg">
          No services yet. Add one to speed up invoice creation.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((s) => (
            <Card key={s.id} className="p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtMoney(Number(s.default_rate), s.currency)} {s.unit ? `/ ${s.unit}` : ""}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.cost_centre ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{s.cost_centre}</span> : null}
                    {spaceName(s.space_id) ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{spaceName(s.space_id)}</span> : null}
                    {projectName(s.project_id) ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{projectName(s.project_id)}</span> : null}
                  </div>
                  {s.description ? <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</div> : null}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit service" : "New service"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
            <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Rate</Label><Input type="number" value={String(editing?.default_rate ?? 0)} onChange={(e) => setEditing({ ...editing!, default_rate: Number(e.target.value) })} /></div>
              <div><Label>Qty</Label><Input type="number" value={String(editing?.default_qty ?? 1)} onChange={(e) => setEditing({ ...editing!, default_qty: Number(e.target.value) })} /></div>
              <div><Label>Unit</Label><Input placeholder="hour, day, item" value={editing?.unit ?? ""} onChange={(e) => setEditing({ ...editing!, unit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Currency</Label>
                <Select value={editing?.currency ?? "GBP"} onValueChange={(v) => setEditing({ ...editing!, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Cost centre</Label><Input value={editing?.cost_centre ?? ""} onChange={(e) => setEditing({ ...editing!, cost_centre: e.target.value })} placeholder="e.g. Maud Street" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Space</Label>
                <Select
                  value={editing?.space_id ?? "__none__"}
                  onValueChange={(v) => setEditing({ ...editing!, space_id: v === "__none__" ? null : v, project_id: null })}
                >
                  <SelectTrigger><SelectValue placeholder="Space" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Project</Label>
                <Select
                  value={editing?.project_id ?? "__none__"}
                  onValueChange={(v) => setEditing({ ...editing!, project_id: v === "__none__" ? null : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {filteredProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing?.is_active ?? true} onChange={(e) => setEditing({ ...editing!, is_active: e.target.checked })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
