import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Space = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  is_default?: boolean | null;
  created_at: string;
  updated_at: string;
};

export function useSpaces() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Space[];
    },
  });

  const createSpace = useMutation({
    mutationFn: async (space: Omit<Space, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('spaces')
        .insert({ ...space, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast({ title: "Space created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating space", description: error.message, variant: "destructive" });
    },
  });

  const updateSpace = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Space> & { id: string }) => {
      const { data, error } = await supabase
        .from('spaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast({ title: "Space updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating space", description: error.message, variant: "destructive" });
    },
  });

  const deleteSpace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast({ title: "Space deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting space", description: error.message, variant: "destructive" });
    },
  });

  return {
    spaces,
    isLoading,
    createSpace,
    updateSpace,
    deleteSpace,
  };
}