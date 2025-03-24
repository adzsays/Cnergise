
import { Task, Project, Feature, TaskStatus, TaskPriority, StageType, Subtask } from "@/components/tasks/ProjectTaskManager";

export interface TaskCSVRow {
  title: string;
  description?: string;
  projectId: string;
  featureId?: string;
  stage: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  subtasks?: string;
}

/**
 * Parse CSV content into task objects
 */
export const parseTasksFromCSV = (
  csvContent: string,
  projects: Project[],
  features: Feature[]
): { tasks: Task[], errors: string[] } => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  const tasks: Task[] = [];
  const errors: string[] = [];
  
  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',').map(value => value.trim());
    const row: Record<string, string> = {};
    
    // Map CSV values to object properties
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Validate required fields
    if (!row.title || !row.projectid || !row.stage || !row.status || !row.priority) {
      errors.push(`Row ${i}: Missing required fields (title, projectId, stage, status, priority)`);
      continue;
    }
    
    // Validate project exists
    if (!projects.some(p => p.id === row.projectid)) {
      errors.push(`Row ${i}: Project ID "${row.projectid}" does not exist`);
      continue;
    }
    
    // Validate feature if provided
    if (row.featureid && !features.some(f => f.id === row.featureid)) {
      errors.push(`Row ${i}: Feature ID "${row.featureid}" does not exist`);
      continue;
    }
    
    // Validate status
    const status = row.status.toLowerCase() as TaskStatus;
    if (!['todo', 'in-progress', 'blocked', 'completed'].includes(status)) {
      errors.push(`Row ${i}: Invalid status "${row.status}"`);
      continue;
    }
    
    // Validate priority
    const priority = row.priority.toLowerCase() as TaskPriority;
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      errors.push(`Row ${i}: Invalid priority "${row.priority}"`);
      continue;
    }
    
    // Validate stage
    const stage = row.stage.toLowerCase() as StageType;
    if (!['requirements', 'development', 'testing', 'release', 'go-live'].includes(stage)) {
      errors.push(`Row ${i}: Invalid stage "${row.stage}"`);
      continue;
    }
    
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
      title: row.title,
      description: row.description,
      projectId: row.projectid,
      featureId: row.featureid || undefined,
      stage: stage,
      status: status,
      priority: priority,
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
