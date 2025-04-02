
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { parseTasksFromCSV } from "@/utils/csvParser";
import { Project, Feature, Task } from "@/components/tasks/ProjectTaskManager";
import { Sheet, Download } from "lucide-react";

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

  const downloadSampleCsv = () => {
    const csvContent = 
      "title,description,projectId,featureId,stage,status,priority,startDate,dueDate,subtasks\n" +
      "Sample Task,This is a sample task description,,,requirements,todo,medium,,,Subtask 1|Subtask 2";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
        
        // Check if there's data
        if (jsonData.length <= 1 || jsonData[0].length === 0) {
          setErrors(["File is empty or has no data"]);
          setIsUploading(false);
          return;
        }
        
        // Check for title column
        const headers = jsonData[0] as string[];
        if (!headers.some(h => typeof h === 'string' && h.toLowerCase() === 'title')) {
          setErrors(["Missing required 'title' column"]);
          setIsUploading(false);
          return;
        }
        
        // Convert to CSV format for our parser
        const headersRow = headers.join(',');
        const dataRows = jsonData.slice(1).map(row => 
          (row as any[]).map(val => 
            // Handle values that might contain commas
            typeof val === 'string' && val.includes(',') ? `"${val}"` : (val || '')
          ).join(',')
        );
        
        const csvContent = [headersRow, ...dataRows].join('\n');
        
        // Parse the CSV content
        const { tasks, errors: parseErrors } = parseTasksFromCSV(csvContent, projects, features);
        
        if (parseErrors.length > 0) {
          setErrors(parseErrors);
          if (tasks.length === 0) {
            toast.error("Failed to import tasks. Please check the errors.");
            setIsUploading(false);
            return;
          } else {
            toast.warning(`Imported ${tasks.length} tasks with ${parseErrors.length} warnings`);
          }
        }
        
        if (tasks.length > 0) {
          // Handle successful import
          onTasksImported(tasks);
          toast.success(`Successfully imported ${tasks.length} tasks from Excel`);
          onOpenChange(false);
          resetForm();
        }
        
      } else if (fileExt === 'csv') {
        // Handle CSV files (existing logic)
        const text = await file.text();
        const { tasks, errors: parseErrors } = parseTasksFromCSV(text, projects, features);
        
        if (parseErrors.length > 0) {
          setErrors(parseErrors);
          if (tasks.length === 0) {
            toast.error("Failed to import tasks. Please check the errors.");
            setIsUploading(false);
            return;
          } else {
            toast.warning(`Imported ${tasks.length} tasks with ${parseErrors.length} warnings`);
          }
        }
        
        if (tasks.length > 0) {
          // Handle successful import
          onTasksImported(tasks);
          toast.success(`Successfully imported ${tasks.length} tasks from CSV`);
          onOpenChange(false);
          resetForm();
        }
      } else {
        toast.error("Unsupported file format. Please upload a CSV or Excel file.");
        setIsUploading(false);
        return;
      }
    } catch (error) {
      console.error("Error importing tasks:", error);
      setErrors([`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
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
          <DialogDescription>
            Upload a CSV or Excel file with at least a "title" column.
          </DialogDescription>
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
                  {errors.length === 1 ? "Error found:" : `${errors.length} errors/warnings found:`}
                </div>
                <ul className="text-xs list-disc pl-4 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between items-center">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCsv}
              className="h-8 flex items-center gap-1 self-start mt-2"
            >
              <Download className="h-3 w-3" />
              Sample CSV
            </Button>
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
