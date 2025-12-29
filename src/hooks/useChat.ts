import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type ChatChannel = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  channel_id: string;
  content: string;
  sender_name: string;
  created_at: string;
  updated_at: string;
};

export function useChatChannels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ChatChannel[];
    },
  });

  const createChannel = useMutation({
    mutationFn: async (channel: Omit<ChatChannel, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_channels')
        .insert({ ...channel, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      toast({ title: "Channel created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating channel", description: error.message, variant: "destructive" });
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_channels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      toast({ title: "Channel deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting channel", description: error.message, variant: "destructive" });
    },
  });

  return {
    channels,
    isLoading,
    createChannel,
    deleteChannel,
  };
}

export function useChatMessages(channelId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!channelId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, senderName }: { content: string; senderName: string }) => {
      if (!channelId) throw new Error('No channel selected');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          content,
          sender_name: senderName,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error sending message", description: error.message, variant: "destructive" });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting message", description: error.message, variant: "destructive" });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
  };
}
