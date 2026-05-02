import React, { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useSpaces } from "@/hooks/useSpaces";
import { useGoals } from "@/hooks/useGoals";
import { useCurrentSpace } from "@/contexts/SpaceContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, Trash2, Edit, Calendar, Target, Sparkles } from "lucide-react";
import { AIGenerateTasksDialog } from "./AIGenerateTasksDialog";
import { format } from "date-fns";

export function ProjectsTab({ filterGoalId }: { filterGoalId?: string | null } = {}) {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { spaces } = useSpaces();
  const { goals = [] } = useGoals();
  const { currentSpaceId } = useCurrentSpace();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [aiProject, setAiProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as const,
    space_id: "",
    goal_id: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const projectData: any = {
      ...formData,
      space_id: formData.space_id || null,
      goal_id: formData.goal_id || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editingProject) {
      await updateProject.mutateAsync({ id: editingProject.id, ...projectData });
      setEditingProject(null);
    } else {
      await createProject.mutateAsync(projectData);
    }

    setFormData({
      name: "",
      description: "",
      status: "active",
      space_id: "",
      goal_id: "",
      start_date: "",
      end_date: "",
    });
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      space_id: project.space_id || "",
      goal_id: (project as any).goal_id || "",
      start_date: project.start_date ? format(new Date(project.start_date), "yyyy-MM-dd") : "",
      end_date: project.end_date ? format(new Date(project.end_date), "yyyy-MM-dd") : "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject.mutateAsync(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "on-hold": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "archived": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  // Filter by current space and (optionally) by goal
  const visibleProjects = projects.filter((p) => {
    if (currentSpaceId && p.space_id !== currentSpaceId) return false;
    if (filterGoalId && (p as any).goal_id !== filterGoalId) return false;
    return true;
  });

  const goalLookup = new Map(goals.map((g) => [g.id, g] as const));

  if (isLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Workstreams that move a goal forward.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditingProject(null); setFormData({ name: "", description: "", status: "active", space_id: currentSpaceId || "", goal_id: filterGoalId || "", start_date: "", end_date: "" }); }}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="space">Space</Label>
                  <Select
                    value={formData.space_id || "__none__"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, space_id: value === "__none__" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a space" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No Space</SelectItem>
                      {spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="goal">Parent Goal</Label>
                  <Select
                    value={formData.goal_id || "__none__"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, goal_id: value === "__none__" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Link to a goal (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No Goal</SelectItem>
                      {goals
                        .filter((g) => !formData.space_id || (g as any).space_id === formData.space_id)
                        .map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingProject ? "Update Project" : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {visibleProjects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No projects here yet. Create one to start working on a goal.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map((project) => {
            const linkedGoal = (project as any).goal_id ? goalLookup.get((project as any).goal_id) : null;
            return (
              <Card key={project.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </div>

                {linkedGoal && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    <span className="truncate">Goal: {linkedGoal.title}</span>
                  </div>
                )}

                {(project.start_date || project.end_date) && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {project.start_date && format(new Date(project.start_date), "MMM d, yyyy")}
                    {project.start_date && project.end_date && " - "}
                    {project.end_date && format(new Date(project.end_date), "MMM d, yyyy")}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setAiProject(project)}
                    className="flex-1"
                    title="Generate detailed task list with AI"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />AI Tasks
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AIGenerateTasksDialog
        open={!!aiProject}
        onOpenChange={(v) => !v && setAiProject(null)}
        project={aiProject}
        goalTitle={aiProject?.goal_id ? goalLookup.get(aiProject.goal_id)?.title : undefined}
      />
    </div>
  );
}