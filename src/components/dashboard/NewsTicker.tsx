import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsHeadline {
  title: string;
  summary: string;
  category: string;
}

export function NewsTicker() {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-news", {
        body: { category: "general" }
      });

      if (fnError) throw fnError;
      
      if (data?.headlines && data.headlines.length > 0) {
        setHeadlines(data.headlines);
      } else if (data?.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("Failed to load news. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Do not auto-fetch news on mount — user must explicitly trigger via refresh button.
  // (Removed auto-fetch + 15min interval to avoid unnecessary AI/Perplexity costs.)

  // Auto-rotate headlines
  useEffect(() => {
    if (headlines.length === 0 || isPaused || !isActive) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [headlines.length, isPaused, isActive]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "tech": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "business": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "finance": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "world": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isActive) {
    return (
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">News ticker paused</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsActive(true)} className="h-7 px-3">
          Activate
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg animate-pulse">
        <Newspaper className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading latest news...</span>
      </div>
    );
  }

  if (error || headlines.length === 0) {
    return (
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {error || "No news available"}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchNews} className="h-7 px-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const currentHeadline = headlines[currentIndex];

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg border border-border/50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* News icon */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary hidden sm:block">
            Live
          </span>
        </div>

        {/* News content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
              getCategoryColor(currentHeadline.category)
            )}>
              {currentHeadline.category}
            </span>
          </div>
          <p className="text-sm font-medium truncate">
            {currentHeadline.title}
          </p>
          {currentHeadline.summary && (
            <p className="text-xs text-muted-foreground truncate">
              {currentHeadline.summary}
            </p>
          )}
        </div>

        {/* Navigation dots */}
        <div className="shrink-0 flex items-center gap-1.5">
          {headlines.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentIndex 
                  ? "w-4 bg-primary" 
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Refresh button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchNews} 
          className="h-8 w-8 p-0 shrink-0"
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}
