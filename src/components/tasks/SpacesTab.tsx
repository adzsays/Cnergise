import React, { useState } from "react";
import { useSpaces } from "@/hooks/useSpaces";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, FolderOpen } from "lucide-react";

const SPACE_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", 
  "#06b6d4", "#f43f5e", "#a855f7", "#14b8a6", "#f97316"
];

export function SpacesTab() {
  const { spaces, isLoading, createSpace, updateSpace, deleteSpace } = useSpaces();
  const { projects } = useProjects();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: SPACE_COLORS[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSpace) {
      await updateSpace.mutateAsync({ id: editingSpace.id, ...formData });
      setEditingSpace(null);
    } else {
      await createSpace.mutateAsync(formData);
    }
    
    setFormData({
      name: "",
      description: "",
      color: SPACE_COLORS[0],
    });
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (space: any) => {
    setEditingSpace(space);
    setFormData({
      name: space.name,
      description: space.description || "",
      color: space.color || SPACE_COLORS[0],
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this space? Projects will not be deleted.")) {
      await deleteSpace.mutateAsync(id);
    }
  };

  const getProjectsInSpace = (spaceId: string) => {
    return projects.filter(p => p.space_id === spaceId);
  };

  if (isLoading) {
    return <div className="p-6">Loading spaces...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Spaces</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSpace(null); setFormData({ name: "", description: "", color: SPACE_COLORS[0] }); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSpace ? "Edit Space" : "Create New Space"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Space Name</Label>
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
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {SPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-10 rounded-md border-2 ${
                        formData.color === color ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingSpace ? "Update Space" : "Create Space"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {spaces.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No spaces yet. Create your first space to organize your projects!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => {
            const spaceProjects = getProjectsInSpace(space.id);
            return (
              <Card key={space.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: space.color || SPACE_COLORS[0] }}
                  >
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{space.name}</h3>
                    {space.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {space.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {spaceProjects.length} {spaceProjects.length === 1 ? "project" : "projects"}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(space)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(space.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}