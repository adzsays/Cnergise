import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UnifiedMetadata } from "./useUnifiedMetadata";

interface AISearchResult {
  success: boolean;
  ai_response: string | null;
  related_items: UnifiedMetadata[];
  total_context_items: number;
}

export function useAISearch() {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<AISearchResult | null>(null);

  const search = async (query: string): Promise<AISearchResult | null> => {
    if (!query.trim()) {
      toast({
        title: "Enter a search query",
        variant: "destructive",
      });
      return null;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query },
      });

      if (error) throw error;

      setSearchResult(data);
      return data;
    } catch (error: any) {
      console.error('AI Search error:', error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
  };

  return {
    search,
    clearSearch,
    isSearching,
    searchResult,
  };
}
