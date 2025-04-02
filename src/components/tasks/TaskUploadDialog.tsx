
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { parseTasksFromCSV } from "@/utils/csvParser";
import { Project, Feature, Task } from "@/components/tasks/ProjectTaskManager";
import { Sheet } from "lucide-react";

interface TaskUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  features: Feature[];
  onTasksImported: (tasks: Task[]) => void;
}

export const TaskUploadDialog: React.FC<TaskUploadDialogProps> = ({
  open,
  onOpenChange,
  projects,
  features,
  onTasksImported,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const resetForm = () => {
    setFile(null);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    
    try {
      // Read file content
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        // Handle Excel files
        const { read, utils } = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer);
        
        // Get the first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON
        const jsonData = utils.sheet_to_json(worksheet);
        
        // Convert to CSV format for our parser
        const headers = Object.keys(jsonData[0]).join(',');
        const rows = jsonData.map(row => 
          Object.values(row).map(val => 
            // Handle values that might contain commas
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        );
        
        const csvContent = [headers, ...rows].join('\n');
        
        // Parse the CSV content
        const { tasks, errors } = parseTasksFromCSV(csvContent, projects, features);
        
        if (errors.length > 0) {
          setErrors(errors);
          if (tasks.length === 0) {
            toast.error("Failed to import tasks. Please check the errors.");
            setIsUploading(false);
            return;
          }
        }
        
        // Handle successful import
        onTasksImported(tasks);
        toast.success(`Successfully imported ${tasks.length} tasks from Excel`);
        
      } else if (fileExt === 'csv') {
        // Handle CSV files (existing logic)
        const text = await file.text();
        const { tasks, errors } = parseTasksFromCSV(text, projects, features);
        
        if (errors.length > 0) {
          setErrors(errors);
          if (tasks.length === 0) {
            toast.error("Failed to import tasks. Please check the errors.");
            setIsUploading(false);
            return;
          }
        }
        
        // Handle successful import
        onTasksImported(tasks);
        toast.success(`Successfully imported ${tasks.length} tasks from CSV`);
      } else {
        toast.error("Unsupported file format. Please upload a CSV or Excel file.");
        setIsUploading(false);
        return;
      }
      
      // Close dialog and reset
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error importing tasks:", error);
      toast.error("Failed to import tasks. Please check your file format.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Tasks from File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upload a CSV or Excel file with task details
            </p>
          </div>
          
          {file && (
            <div className="text-sm">
              <p className="font-medium">Selected file: {file.name}</p>
            </div>
          )}
          
          {errors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                <div className="text-sm font-medium mb-2">
                  Errors found in file:
                </div>
                <ul className="text-xs list-disc pl-4 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-xs space-y-1">
            <p className="font-medium">Only task title is required!</p>
            <p className="font-medium mt-2">All columns are optional except for title:</p>
            <ul className="list-disc pl-4">
              <li>title - <span className="font-bold">Task title (required)</span></li>
              <li>projectId - Project ID (defaults to first project if missing)</li>
              <li>stage - Stage (defaults to "requirements")</li>
              <li>status - Status (defaults to "todo")</li>
              <li>priority - Priority (defaults to "medium")</li>
              <li>description - Task description</li>
              <li>featureId - Feature ID</li>
              <li>startDate - Start date (YYYY-MM-DD)</li>
              <li>dueDate - Due date (YYYY-MM-DD)</li>
              <li>subtasks - Subtasks (pipe-separated: "Task 1|Task 2|Task 3")</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading ? "Importing..." : "Import Tasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
