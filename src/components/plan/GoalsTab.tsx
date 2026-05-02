import React, { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useProjects } from "@/hooks/useProjects";
import { useCurrentSpace } from "@/contexts/SpaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, FolderKanban, Trash2 } from "lucide-react";

const CATEGORIES = ["Personal", "Career", "Health", "Finance", "Learning", "Business", "Other"];

export function GoalsTab({ onSelectGoal }: { onSelectGoal?: (goalId: string) => void }) {
  const { currentSpaceId } = useCurrentSpace();
  const { goals = [], isLoading, createGoal, deleteGoal } = useGoals();
  const { projects = [] } = useProjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Personal", deadline: "" });

  const filtered = goals.filter((g: any) => !currentSpaceId || g.space_id === currentSpaceId);

  const projectsByGoal = (goalId: string) =>
    projects.filter((p) => (p as any).goal_id === goalId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGoal.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      progress: 0,
      status: "active",
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      ...(currentSpaceId ? { space_id: currentSpaceId } : {}),
    } as any);
    setForm({ title: "", description: "", category: "Personal", deadline: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Goals</h2>
          <p className="text-sm text-muted-foreground">
            Start here. Goals define the "why" — projects and tasks roll up to them.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create goal</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} required onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No goals in this space yet</p>
          <p className="text-sm text-muted-foreground">Goals are the top of your plan. Create one to begin.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((goal) => {
            const linked = projectsByGoal(goal.id);
            return (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription className="text-xs mt-1 line-clamp-2">{goal.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{goal.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="tabular-nums">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectGoal?.(goal.id)}
                    className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {linked.length} project{linked.length === 1 ? "" : "s"}
                    </span>
                    <span className="underline-offset-2 hover:underline">View →</span>
                  </button>
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => confirm("Delete this goal?") && deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
