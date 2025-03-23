
import React, { useState } from "react";
import { type Feature, type Project } from "./ProjectTaskManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFeature: (feature: Feature) => void;
  projects: Project[];
  selectedProject?: string | null;
}

export function NewFeatureDialog({ 
  open, 
  onOpenChange, 
  onCreateFeature, 
  projects,
  selectedProject 
}: NewFeatureDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(selectedProject || "");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !projectId) return;
    
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      projectId
    };
    
    onCreateFeature(newFeature);
    
    // Reset form
    setName("");
    setDescription("");
    if (!selectedProject) {
      setProjectId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Feature</DialogTitle>
            <DialogDescription>
              Add a new feature to organize related tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feature-name">Feature Name</Label>
              <Input 
                id="feature-name"
                placeholder="Enter feature name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feature-description">Description</Label>
              <Textarea 
                id="feature-description"
                placeholder="Enter feature description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-select">Project</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={!!selectedProject}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !projectId}>Create Feature</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
