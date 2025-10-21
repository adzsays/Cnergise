import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Project = {
  id: string;
  user_id: string;
  space_id?: string | null;
  name: string;
  description?: string | null;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
};

export function useProjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({ ...project, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating project", description: error.message, variant: "destructive" });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating project", description: error.message, variant: "destructive" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting project", description: error.message, variant: "destructive" });
    },
  });

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}