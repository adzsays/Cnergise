import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Task = {
  id: string;
  user_id: string;
  project_id?: string | null;
  feature_id?: string | null;
  assigned_to?: string | null;
  team_id?: string | null;
  title: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
};

export function useTasks(projectId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Task created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Task updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Task deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    },
  });

  const bulkCreateTasks = useMutation({
    mutationFn: async (tasks: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tasksWithUser = tasks.map(task => ({ ...task, user_id: user.id }));
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksWithUser)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Tasks imported successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error importing tasks", description: error.message, variant: "destructive" });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    bulkCreateTasks,
  };
}