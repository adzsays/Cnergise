import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Search, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: "crypto" | "stock" | "commodity";
}

const cryptoAssets: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67432.50, change: 2.4, type: "crypto" },
  { symbol: "ETH", name: "Ethereum", price: 3521.80, change: 1.8, type: "crypto" },
  { symbol: "SOL", name: "Solana", price: 172.35, change: -0.5, type: "crypto" },
  { symbol: "XRP", name: "Ripple", price: 0.52, change: 0.3, type: "crypto" },
  { symbol: "ADA", name: "Cardano", price: 0.45, change: -1.2, type: "crypto" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.12, change: 5.2, type: "crypto" },
];

const stockAssets: Asset[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.25, change: 1.2, type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.8, type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 175.80, change: -0.3, type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 185.40, change: 1.5, type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.90, change: -2.1, type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.30, change: 3.2, type: "stock" },
];

const commodityAssets: Asset[] = [
  { symbol: "GOLD", name: "Gold", price: 2345.60, change: 0.5, type: "commodity" },
  { symbol: "SILVER", name: "Silver", price: 27.85, change: -0.2, type: "commodity" },
  { symbol: "OIL", name: "Crude Oil", price: 78.45, change: 1.8, type: "commodity" },
  { symbol: "NATGAS", name: "Natural Gas", price: 2.15, change: -1.5, type: "commodity" },
  { symbol: "COPPER", name: "Copper", price: 4.52, change: 0.8, type: "commodity" },
  { symbol: "WHEAT", name: "Wheat", price: 5.78, change: -0.3, type: "commodity" },
];

export function TradeEntry() {
  const [assetType, setAssetType] = useState<"crypto" | "stock" | "commodity">("crypto");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getAssetList = () => {
    switch (assetType) {
      case "crypto":
        return cryptoAssets;
      case "stock":
        return stockAssets;
      case "commodity":
        return commodityAssets;
    }
  };

  const filteredAssets = getAssetList().filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTotal = () => {
    if (!selectedAsset || !quantity) return 0;
    const price = orderType === "limit" && limitPrice ? parseFloat(limitPrice) : selectedAsset.price;
    return price * parseFloat(quantity);
  };

  const handleTrade = () => {
    if (!selectedAsset || !quantity) {
      toast.error("Please select an asset and enter quantity");
      return;
    }

    const total = calculateTotal();
    toast.success(
      `${tradeType === "buy" ? "Buy" : "Sell"} order placed: ${quantity} ${selectedAsset.symbol} for $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );

    // Reset form
    setQuantity("");
    setLimitPrice("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Asset Selection */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Trade Assets
          </CardTitle>
          <CardDescription>Select an asset type and choose what to trade</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={assetType} onValueChange={(v) => setAssetType(v as typeof assetType)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="stock">Stocks</TabsTrigger>
              <TabsTrigger value="commodity">Commodities</TabsTrigger>
            </TabsList>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                    selectedAsset?.symbol === asset.symbol
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{asset.symbol}</span>
                        <Badge variant="secondary" className="text-xs">
                          {asset.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p
                        className={`text-sm flex items-center justify-end gap-1 ${
                          asset.change >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {asset.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {asset.change >= 0 ? "+" : ""}
                        {asset.change}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle>Place Order</CardTitle>
          <CardDescription>
            {selectedAsset
              ? `Trading ${selectedAsset.name} (${selectedAsset.symbol})`
              : "Select an asset to trade"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tradeType === "buy" ? "default" : "outline"}
              onClick={() => setTradeType("buy")}
              className={tradeType === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "outline"}
              onClick={() => setTradeType("sell")}
              className={tradeType === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Sell
            </Button>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market Order</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
                <SelectItem value="stop">Stop Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Limit Price (if limit order) */}
          {orderType === "limit" && (
            <div className="space-y-2">
              <Label>Limit Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
            </div>
          )}

          {/* Current Price Display */}
          {selectedAsset && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-medium">
                  ${selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {quantity && (
                <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">Estimated Total</span>
                  <span className="font-semibold">
                    ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleTrade}
            disabled={!selectedAsset || !quantity}
            className={`w-full ${
              tradeType === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {tradeType === "buy" ? "Buy" : "Sell"} {selectedAsset?.symbol || "Asset"}
          </Button>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            Demo trading only. No real transactions are processed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
