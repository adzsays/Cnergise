
import { Task, Project, Feature, TaskStatus, TaskPriority, StageType, Subtask } from "@/components/tasks/ProjectTaskManager";

export interface TaskCSVRow {
  title: string;
  description?: string;
  projectId?: string;
  featureId?: string;
  stage?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  subtasks?: string;
}

export const parseTasksFromCSV = (
  csvContent: string,
  projects: Project[],
  features: Feature[]
): { tasks: Task[], errors: string[] } => {
  // Trim whitespace and handle empty or null input
  const sanitizedContent = (csvContent || '').trim();
  
  if (!sanitizedContent) {
    return { tasks: [], errors: ["File is empty"] };
  }

  const lines = sanitizedContent.split('\n').filter(line => line.trim() !== '');
  
  // Handle empty file after filtering
  if (lines.length === 0) {
    return { tasks: [], errors: ["No valid data found in the file"] };
  }

  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  // Check if title column exists
  const titleIndex = headers.findIndex(h => h === 'title');
  if (titleIndex === -1) {
    return { tasks: [], errors: ["Missing required 'title' column"] };
  }
  
  const tasks: Task[] = [];
  const errors: string[] = [];
  
  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(value => value.trim());
    
    // Check if title is not empty
    const taskTitle = values[titleIndex];
    if (!taskTitle) {
      errors.push(`Row ${i}: No task title found`);
      continue;
    }
    
    const row: Record<string, string> = {};
    
    // Map CSV values to object properties
    headers.forEach((header, index) => {
      if (index < values.length) {
        row[header] = values[index] || '';
      }
    });
    
    // Default values for optional fields
    const defaultProjectId = projects.length > 0 ? projects[0].id : '';
    const projectId = row.projectid && projects.some(p => p.id === row.projectid) 
      ? row.projectid 
      : defaultProjectId;
    
    // If project doesn't exist and we can't set a default, log warning but still create task
    if (!projectId) {
      errors.push(`Row ${i}: No valid project ID provided and no default project available. Task will be created without a project.`);
    }
    
    // Validate feature if provided
    let featureId = undefined;
    if (row.featureid) {
      if (features.some(f => f.id === row.featureid)) {
        featureId = row.featureid;
      } else {
        errors.push(`Row ${i}: Feature ID "${row.featureid}" does not exist. Task will be created without a feature.`);
      }
    }
    
    // Set default values or validate provided ones
    const status = validateStatus(row.status) || 'todo';
    const priority = validatePriority(row.priority) || 'medium';
    const stage = validateStage(row.stage) || 'requirements';
    
    // Parse subtasks if provided
    let subtasks: Subtask[] = [];
    if (row.subtasks) {
      try {
        // Format expected: "Task 1|Task 2|Task 3"
        subtasks = row.subtasks.split('|').map((title, idx) => ({
          id: `subtask-${Date.now()}-${idx}`,
          title: title.trim(),
          completed: false
        }));
      } catch (err) {
        errors.push(`Row ${i}: Invalid subtasks format. Use pipe-separated list.`);
      }
    }
    
    // Create task object
    const task: Task = {
      id: `task-${Date.now()}-${i}`,
      title: taskTitle,
      description: row.description || '',
      projectId: projectId || undefined,
      featureId: featureId,
      stage: stage as StageType,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      startDate: row.startdate || undefined,
      dueDate: row.duedate || undefined,
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      subtasks: subtasks,
    };
    
    tasks.push(task);
  }
  
  return { tasks, errors };
};

// Helper functions for validation
function validateStatus(status?: string): TaskStatus | null {
  if (!status) return null;
  const normalizedStatus = status.toLowerCase();
  if (['todo', 'in-progress', 'blocked', 'completed'].includes(normalizedStatus)) {
    return normalizedStatus as TaskStatus;
  }
  return null;
}

function validatePriority(priority?: string): TaskPriority | null {
  if (!priority) return null;
  const normalizedPriority = priority.toLowerCase();
  if (['low', 'medium', 'high', 'urgent'].includes(normalizedPriority)) {
    return normalizedPriority as TaskPriority;
  }
  return null;
}

function validateStage(stage?: string): StageType | null {
  if (!stage) return null;
  const normalizedStage = stage.toLowerCase();
  if (['requirements', 'development', 'testing', 'release', 'go-live'].includes(normalizedStage)) {
    return normalizedStage as StageType;
  }
  return null;
}
