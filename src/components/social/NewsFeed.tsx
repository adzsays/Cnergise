import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Clock, TrendingUp, TrendingDown, Newspaper } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  category: "crypto" | "stocks" | "economy" | "commodities";
  time: string;
  summary: string;
  impact?: "bullish" | "bearish" | "neutral";
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "Bitcoin Surges Past $100K Amid Institutional Buying",
    source: "CoinDesk",
    category: "crypto",
    time: "15m ago",
    summary: "Major institutional investors continue accumulating Bitcoin as market sentiment turns bullish.",
    impact: "bullish"
  },
  {
    id: 2,
    title: "Federal Reserve Signals Potential Rate Cuts in 2025",
    source: "Reuters",
    category: "economy",
    time: "32m ago",
    summary: "Fed officials indicate openness to monetary policy easing if inflation continues cooling.",
    impact: "bullish"
  },
  {
    id: 3,
    title: "Nvidia Reports Record Quarterly Earnings",
    source: "Bloomberg",
    category: "stocks",
    time: "1h ago",
    summary: "AI chip demand drives Nvidia to beat analyst expectations by 15%.",
    impact: "bullish"
  },
  {
    id: 4,
    title: "Gold Prices Retreat on Strong Dollar",
    source: "MarketWatch",
    category: "commodities",
    time: "2h ago",
    summary: "Precious metals face headwinds as USD strengthens against major currencies.",
    impact: "bearish"
  },
  {
    id: 5,
    title: "Ethereum ETF Sees Record Inflows",
    source: "The Block",
    category: "crypto",
    time: "2h ago",
    summary: "Institutional appetite for Ethereum exposure grows with new ETF products.",
    impact: "bullish"
  },
  {
    id: 6,
    title: "Oil Prices Stabilize Amid OPEC+ Meeting",
    source: "CNBC",
    category: "commodities",
    time: "3h ago",
    summary: "Energy markets await production decision from major oil producers.",
    impact: "neutral"
  },
  {
    id: 7,
    title: "Tech Sector Leads Market Rally",
    source: "WSJ",
    category: "stocks",
    time: "4h ago",
    summary: "Major tech stocks push indices higher on strong earnings outlook.",
    impact: "bullish"
  },
  {
    id: 8,
    title: "Solana Network Activity Hits All-Time High",
    source: "CryptoSlate",
    category: "crypto",
    time: "5h ago",
    summary: "DeFi and NFT activity surge on Solana blockchain amid lower fees.",
    impact: "bullish"
  }
];

const categoryColors: Record<string, string> = {
  crypto: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  stocks: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  economy: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  commodities: "bg-amber-500/10 text-amber-500 border-amber-500/20"
};

export const NewsFeed = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Financial News</h3>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {newsItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={categoryColors[item.category]}>
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      {item.impact && (
                        <div className="flex items-center gap-1">
                          {item.impact === "bullish" && (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                          {item.impact === "bearish" && (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-xs ${
                            item.impact === "bullish" ? "text-green-500" : 
                            item.impact === "bearish" ? "text-red-500" : 
                            "text-muted-foreground"
                          }`}>
                            {item.impact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
