import { useState } from "react";
import { Search, Sparkles, Loader2, Mail, Calendar, DollarSign, Target, Users, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAISearch } from "@/hooks/useAISearch";
import { formatDistanceToNow } from "date-fns";

const sourceIcons: Record<string, any> = {
  email: Mail,
  calendar: Calendar,
  finance: DollarSign,
  task: Target,
  goal: Target,
  contact: Users,
  chat: MessageSquare,
};

export function AISearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { search, isSearching, searchResult, clearSearch } = useAISearch();

  const handleSearch = async () => {
    if (!query.trim()) return;
    await search(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setQuery("");
      clearSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">AI Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Cross-Link Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about your data... e.g., 'meetings related to marketing expenses'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isSearching && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Searching across your data...
            </div>
          )}

          {searchResult && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* AI Response */}
                {searchResult.ai_response && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">AI Analysis</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{searchResult.ai_response}</p>
                  </div>
                )}

                {/* Related Items */}
                {searchResult.related_items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Related Items ({searchResult.related_items.length})
                    </h4>
                    {searchResult.related_items.map((item) => {
                      const Icon = sourceIcons[item.source_type] || Target;
                      return (
                        <div 
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => item.external_url && window.open(item.external_url, '_blank')}
                        >
                          <div className="p-2 rounded-full bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{item.title}</p>
                              <Badge variant="secondary" className="text-xs">
                                {item.source_type}
                              </Badge>
                              {item.external_url && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {item.amount && (
                                <span className="font-medium">${item.amount}</span>
                              )}
                              {item.date_occurred && (
                                <span>{formatDistanceToNow(new Date(item.date_occurred), { addSuffix: true })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!searchResult.ai_response && searchResult.related_items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No results found. Try a different search query.
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Searched across {searchResult.total_context_items} items in your data
                </p>
              </div>
            </ScrollArea>
          )}

          {!isSearching && !searchResult && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p className="mb-2">Examples:</p>
              <div className="space-y-1 text-xs">
                <p>"Show meetings related to project expenses"</p>
                <p>"Find emails about the marketing budget"</p>
                <p>"What tasks are connected to client meetings?"</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
