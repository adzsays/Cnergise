import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: number;
  type: "crypto" | "stock" | "commodity";
}

const tickerData: TickerItem[] = [
  { symbol: "BTC", name: "Bitcoin", price: "$102,450", change: 3.24, type: "crypto" },
  { symbol: "ETH", name: "Ethereum", price: "$3,890", change: 2.15, type: "crypto" },
  { symbol: "SOL", name: "Solana", price: "$198.50", change: 5.67, type: "crypto" },
  { symbol: "AAPL", name: "Apple", price: "$198.25", change: 1.12, type: "stock" },
  { symbol: "NVDA", name: "Nvidia", price: "$875.40", change: 4.56, type: "stock" },
  { symbol: "TSLA", name: "Tesla", price: "$412.80", change: -1.23, type: "stock" },
  { symbol: "GOLD", name: "Gold", price: "$2,045", change: -0.45, type: "commodity" },
  { symbol: "OIL", name: "Crude Oil", price: "$78.50", change: 0.89, type: "commodity" },
  { symbol: "XRP", name: "Ripple", price: "$2.45", change: 8.90, type: "crypto" },
  { symbol: "AMZN", name: "Amazon", price: "$185.60", change: 1.78, type: "stock" },
  { symbol: "MSFT", name: "Microsoft", price: "$425.30", change: 0.95, type: "stock" },
  { symbol: "BNB", name: "BNB", price: "$625.40", change: 2.34, type: "crypto" },
  { symbol: "SILVER", name: "Silver", price: "$24.50", change: -0.67, type: "commodity" },
  { symbol: "ADA", name: "Cardano", price: "$0.98", change: 4.21, type: "crypto" },
  { symbol: "GOOGL", name: "Google", price: "$175.20", change: 1.45, type: "stock" },
];

export const MarketTicker = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Duplicate items for seamless loop
  const items = [...tickerData, ...tickerData, ...tickerData];
  const itemWidth = 200; // Approximate width of each item
  const totalWidth = tickerData.length * itemWidth;

  // Reset offset when it exceeds one full cycle
  const adjustedOffset = offset % totalWidth;

  return (
    <div className="w-full overflow-hidden bg-card border-y border-border">
      <div 
        className="flex items-center py-2 whitespace-nowrap"
        style={{ 
          transform: `translateX(${adjustedOffset}px)`,
          transition: 'none'
        }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center gap-3 px-4 border-r border-border/50 min-w-[180px]"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{item.symbol}</span>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.price}</span>
                <div className={`flex items-center gap-0.5 text-xs ${
                  item.change >= 0 ? "text-green-500" : "text-red-500"
                }`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{item.change >= 0 ? "+" : ""}{item.change}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
