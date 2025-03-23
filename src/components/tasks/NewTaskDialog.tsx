
import React, { useState, useEffect } from "react";
import { 
  type Task, 
  type Project, 
  type Feature, 
  type Team, 
  type FunctionType, 
  type StageType, 
  type CurrencyType 
} from "./ProjectTaskManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  features: Feature[];
  teams: Team[];
  selectedProject: string | null;
  selectedFeature: string | null;
  onCreateTask: (task: Task) => void;
}

export function NewTaskDialog({ 
  open, 
  onOpenChange, 
  projects, 
  features,
  teams,
  selectedProject, 
  selectedFeature,
  onCreateTask 
}: NewTaskDialogProps) {
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  
  // Create form schema
  const formSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    projectId: z.string().min(1, "Project is required"),
    featureId: z.string().optional(),
    functionType: z.enum(["backend", "frontend", "design", "qa", "devops", "business", "other"]).optional(),
    stage: z.enum(["requirements", "development", "testing", "release", "go-live"]).default("requirements"),
    teamId: z.string().optional(),
    assignee: z.string().optional(),
    status: z.enum(["todo", "in-progress", "completed", "blocked"]).default("todo"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    monetaryAmount: z.coerce.number().optional(),
    monetaryCurrency: z.enum(["USD", "EUR", "GBP", "JPY", "INR", "CNY"]).default("USD"),
    latestComments: z.string().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    completionPercentage: z.coerce.number().min(0).max(100).default(0),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      featureId: "",
      functionType: undefined,
      stage: "requirements",
      teamId: "",
      assignee: "",
      status: "todo",
      priority: "medium",
      monetaryAmount: undefined,
      monetaryCurrency: "USD",
      latestComments: "",
      startDate: "",
      dueDate: "",
      completionPercentage: 0,
    },
  });
  
  // Set initial values when dialog opens
  useEffect(() => {
    if (open) {
      // Reset form
      form.reset({
        title: "",
        description: "",
        projectId: selectedProject || (projects.length > 0 ? projects[0].id : ""),
        featureId: selectedFeature || "",
        functionType: undefined,
        stage: "requirements",
        teamId: "",
        assignee: "",
        status: "todo",
        priority: "medium",
        monetaryAmount: undefined,
        monetaryCurrency: "USD",
        latestComments: "",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 7);
          return tomorrow.toISOString().split('T')[0];
        })(),
        completionPercentage: 0,
      });
      
      // Reset subtasks
      setSubtasks([]);
      setNewSubtask("");
    }
  }, [open, selectedProject, selectedFeature, projects, form]);
  
  // Generate task number
  const generateTaskNo = () => {
    return `T${String(Math.floor(Math.random() * 9000) + 1000)}`;
  };
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      taskNo: generateTaskNo(),
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      featureId: values.featureId || undefined,
      functionType: values.functionType as FunctionType | undefined,
      stage: values.stage as StageType,
      projectId: values.projectId,
      teamId: values.teamId || undefined,
      assignee: values.assignee || undefined,
      status: values.status,
      priority: values.priority,
      monetaryImpact: values.monetaryAmount ? {
        amount: values.monetaryAmount,
        currency: values.monetaryCurrency as CurrencyType
      } : undefined,
      latestComments: values.latestComments?.trim() || undefined,
      startDate: values.startDate || undefined,
      dueDate: values.dueDate || undefined,
      completedDate: values.status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
      completionPercentage: values.completionPercentage,
      createdAt: new Date().toISOString(),
      subtasks: [...subtasks],
      dependencyIds: [],
    };
    
    onCreateTask(newTask);
    onOpenChange(false);
  };
  
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    setSubtasks([
      ...subtasks,
      {
        id: `subtask-${Date.now()}-${subtasks.length}`,
        title: newSubtask.trim(),
        completed: false,
      },
    ]);
    
    setNewSubtask("");
  };
  
  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };
  
  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create a New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your project with detailed information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter task description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex items-center">
                                <div 
                                  className="h-2 w-2 rounded-full mr-2" 
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="featureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature (Optional)</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a feature" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Feature</SelectItem>
                          {features
                            .filter(f => !form.watch("projectId") || f.projectId === form.watch("projectId"))
                            .map((feature) => (
                              <SelectItem key={feature.id} value={feature.id}>
                                {feature.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="functionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Function (Optional)</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select function" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Function</SelectItem>
                          <SelectItem value="backend">Backend</SelectItem>
                          <SelectItem value="frontend">Frontend</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="qa">QA</SelectItem>
                          <SelectItem value="devops">DevOps</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="requirements">Requirements</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                          <SelectItem value="release">Release</SelectItem>
                          <SelectItem value="go-live">Go-Live</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team (Optional)</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assignee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assignee name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="completionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Percentage</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            {...field} 
                            className="w-20 mr-2"
                          />
                          <span>%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="monetaryAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monetary Impact (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="monetaryCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="CNY">CNY (¥)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="latestComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latest Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter latest comments"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label htmlFor="task-subtasks">Subtasks</Label>
                
                <div className="flex items-center gap-2">
                  <Input 
                    id="task-subtasks"
                    placeholder="Add a subtask"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={handleSubtaskKeyDown}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddSubtask}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {subtasks.length > 0 && (
                  <div className="mt-2 space-y-2 border rounded-md p-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={subtask.completed}
                            onCheckedChange={(checked) => {
                              setSubtasks(
                                subtasks.map((st) =>
                                  st.id === subtask.id
                                    ? { ...st, completed: !!checked }
                                    : st
                                )
                              );
                            }}
                          />
                          <span className="text-sm">{subtask.title}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveSubtask(subtask.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
