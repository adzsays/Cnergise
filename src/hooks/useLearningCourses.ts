import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LearningCourse {
  id: string;
  user_id: string;
  space_id: string | null;
  title: string;
  provider: string;
  course_url: string | null;
  image_url: string | null;
  instructor: string | null;
  description: string | null;
  status: string;
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
  external_course_id: string | null;
  certificate_url: string | null;
  estimated_hours: number | null;
  synced_from_provider: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CourseInsert = Omit<LearningCourse, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useLearningCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['learning-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_courses')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as LearningCourse[];
    },
  });

  const addCourse = useMutation({
    mutationFn: async (course: Partial<CourseInsert>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('learning_courses')
        .insert({ 
          ...course, 
          user_id: user.id,
          title: course.title || 'Untitled Course',
          provider: course.provider || 'coursera',
          status: course.status || 'enrolled',
          progress_percent: course.progress_percent || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
      toast({ title: "Course added successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to add course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LearningCourse> & { id: string }) => {
      const { data, error } = await supabase
        .from('learning_courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
      toast({ title: "Course updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('learning_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
      toast({ title: "Course removed" });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const updates: Partial<LearningCourse> = {
        progress_percent: progress,
        status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'enrolled',
      };
      
      if (progress >= 100) {
        updates.completed_at = new Date().toISOString();
      }
      if (progress > 0 && !courses?.find(c => c.id === id)?.started_at) {
        updates.started_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('learning_courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
    },
  });

  // Stats
  const stats = {
    total: courses?.length || 0,
    inProgress: courses?.filter(c => c.status === 'in_progress').length || 0,
    completed: courses?.filter(c => c.status === 'completed').length || 0,
    totalHours: courses?.reduce((sum, c) => sum + (c.estimated_hours || 0), 0) || 0,
  };

  return {
    courses,
    isLoading,
    addCourse,
    updateCourse,
    deleteCourse,
    updateProgress,
    stats,
    refetch,
  };
}
