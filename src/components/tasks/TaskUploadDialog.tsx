
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

interface TaskUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskUploadDialog: React.FC<TaskUploadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bulkCreateTasks } = useTasks();
  const { projects } = useProjects();

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
      "title,description,priority,status,due_date,project_id\n" +
      "Sample Task,This is a sample task description,medium,todo,2025-12-31,";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseTasksFromData = (headers: string[], rows: string[][]): any[] => {
    const tasks: any[] = [];
    const titleIndex = headers.findIndex(h => h.toLowerCase() === 'title');
    
    if (titleIndex === -1) {
      setErrors(["Missing required 'title' column"]);
      return [];
    }

    const defaultProjectId = projects.length > 0 ? projects[0].id : null;

    rows.forEach((row, index) => {
      const title = row[titleIndex]?.trim();
      if (!title) {
        setErrors(prev => [...prev, `Row ${index + 2}: Missing title`]);
        return;
      }

      const task: any = {
        title,
        description: row[headers.findIndex(h => h.toLowerCase() === 'description')] || null,
        priority: (row[headers.findIndex(h => h.toLowerCase() === 'priority')] || 'medium') as 'low' | 'medium' | 'high',
        status: (row[headers.findIndex(h => h.toLowerCase() === 'status')] || 'todo') as 'todo' | 'in_progress' | 'done',
        due_date: row[headers.findIndex(h => h.toLowerCase() === 'due_date')] || null,
        project_id: row[headers.findIndex(h => h.toLowerCase() === 'project_id')] || defaultProjectId,
      };

      tasks.push(task);
    });

    return tasks;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setErrors([]);
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let headers: string[] = [];
      let rows: string[][] = [];
      
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        const { read, utils } = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length <= 1) {
          setErrors(["File is empty or has no data"]);
          setIsUploading(false);
          return;
        }
        
        headers = jsonData[0].map((h: any) => String(h).toLowerCase());
        rows = jsonData.slice(1).map(row => row.map(cell => cell != null ? String(cell) : ''));
      } else if (fileExt === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length <= 1) {
          setErrors(["File is empty or has no data"]);
          setIsUploading(false);
          return;
        }
        
        headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
        rows = lines.slice(1).map(line => parseCsvLine(line));
      } else {
        toast.error("Unsupported file format. Please upload a CSV or Excel file.");
        setIsUploading(false);
        return;
      }
      
      const tasks = parseTasksFromData(headers, rows);
      
      if (tasks.length === 0) {
        toast.error("No valid tasks found in file");
        setIsUploading(false);
        return;
      }
      
      await bulkCreateTasks.mutateAsync(tasks);
      toast.success(`Successfully imported ${tasks.length} tasks`);
      onOpenChange(false);
      resetForm();
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
              <p className="font-medium">Required column:</p>
              <ul className="list-disc pl-4">
                <li>title - Task title</li>
              </ul>
              <p className="font-medium mt-2">Optional columns:</p>
              <ul className="list-disc pl-4">
                <li>description - Task description</li>
                <li>priority - Priority (low/medium/high, defaults to medium)</li>
                <li>status - Status (todo/in_progress/done, defaults to todo)</li>
                <li>due_date - Due date (YYYY-MM-DD format)</li>
                <li>project_id - Project ID (uses first project if empty)</li>
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
