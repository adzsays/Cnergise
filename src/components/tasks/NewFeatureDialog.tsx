
import React, { useState } from "react";
import { type Feature, type Project, type CurrencyType } from "./ProjectTaskManager";
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
  const [priority, setPriority] = useState<Feature["priority"]>("medium");
  const [amount, setAmount] = useState<string>("0");
  const [currency, setCurrency] = useState<CurrencyType>("USD");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !projectId) return;
    
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      projectId,
      priority,
      monetaryImpact: {
        amount: parseFloat(amount) || 0,
        currency: currency
      }
    };
    
    onCreateFeature(newFeature);
    
    // Reset form
    setName("");
    setDescription("");
    setPriority("medium");
    setAmount("0");
    setCurrency("USD");
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
            
            <div className="space-y-2">
              <Label htmlFor="priority-select">Priority</Label>
              <Select
                value={priority || "medium"}
                onValueChange={(value) => setPriority(value as Feature["priority"])}
              >
                <SelectTrigger id="priority-select">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount-input">Impact Amount</Label>
                <Input
                  id="amount-input"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency-select">Currency</Label>
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as CurrencyType)}
                >
                  <SelectTrigger id="currency-select">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
