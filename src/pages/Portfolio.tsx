
import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowRightLeft } from "lucide-react";
import { TradeEntry } from "@/components/portfolio/TradeEntry";
import { MarketTicker } from "@/components/social/MarketTicker";
import { SleekChart } from "@/components/ui/SleekChart";
import { IBKRConnection } from "@/components/portfolio/IBKRConnection";
import { RiskManager } from "@/components/portfolio/RiskManager";
import { StrategyManager } from "@/components/portfolio/StrategyManager";
import { LiveHoldings } from "@/components/portfolio/LiveHoldings";

export default function Portfolio() {
  const [activeTab, setActiveTab] = React.useState("overview");
  
  const portfolioValue = 152768.42;
  const portfolioChange = 1243.87;
  const portfolioChangePercent = 0.82;
  
  const marketData = [
    { name: 'Jan', value: 140000 },
    { name: 'Feb', value: 139000 },
    { name: 'Mar', value: 145000 },
    { name: 'Apr', value: 148000 },
    { name: 'May', value: 151500 },
    { name: 'Jun', value: 152768 }
  ];
  
  const assetAllocation = [
    { name: 'Stocks', value: 65 },
    { name: 'Bonds', value: 20 },
    { name: 'Cash', value: 5 },
    { name: 'Real Estate', value: 10 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const topHoldings = [
    { name: 'AAPL', fullName: 'Apple Inc.', value: 12500, change: 2.3 },
    { name: 'MSFT', fullName: 'Microsoft Corp.', value: 10200, change: 1.5 },
    { name: 'AMZN', fullName: 'Amazon.com Inc.', value: 8750, change: -0.8 },
    { name: 'GOOGL', fullName: 'Alphabet Inc.', value: 7800, change: 0.5 },
    { name: 'TSLA', fullName: 'Tesla Inc.', value: 6900, change: -1.2 }
  ];
  
  const performance = [
    { name: '1m', portfolio: 0.82, benchmark: 0.7 },
    { name: '3m', portfolio: 2.1, benchmark: 1.8 },
    { name: '6m', portfolio: 4.3, benchmark: 3.9 },
    { name: 'YTD', portfolio: 5.2, benchmark: 4.7 },
    { name: '1y', portfolio: 9.8, benchmark: 8.5 },
    { name: '3y', portfolio: 22.3, benchmark: 19.8 }
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <MarketTicker />
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden h-9 w-9" />
                  <h1 className="text-2xl font-bold gradient-heading">Portfolio</h1>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple"></div>
                </div>
              </div>
            </header>
            
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { value: "overview", label: "Overview" },
                { value: "trade", label: "Trade" },
                { value: "holdings", label: "Holdings" },
                { value: "strategies", label: "AI Strategies" },
                { value: "risk", label: "Risk" },
                { value: "ibkr", label: "IBKR" },
                { value: "performance", label: "Performance" },
                { value: "transactions", label: "Transactions" }
              ]}
              actions={
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              }
            />
            
            <div className="flex-1 overflow-auto p-3 md:p-6 pb-[env(safe-area-inset-bottom)]">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm md:text-base">Portfolio Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <div className="text-2xl md:text-3xl font-bold tabular-nums">
                            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`flex items-center text-xs md:text-sm ${portfolioChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {portfolioChangePercent >= 0 ? (
                              <TrendingUp className="mr-1 h-4 w-4" />
                            ) : (
                              <TrendingDown className="mr-1 h-4 w-4" />
                            )}
                            <span className="tabular-nums">
                              ${Math.abs(portfolioChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              ({portfolioChangePercent >= 0 ? '+' : ''}{portfolioChangePercent.toFixed(2)}%)
                            </span>
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">Today</div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="md:col-span-2">
                      <SleekChart
                        kind="area"
                        data={marketData}
                        xKey="name"
                        series={[{ key: "value", label: "Value", color: "primary" }]}
                        title="Portfolio History"
                        subtitle="6-month performance"
                        kpi={`$${(marketData[marketData.length - 1].value / 1000).toFixed(1)}k`}
                        valueFormatter={(v) => `$${v.toLocaleString()}`}
                        compactHeight={120}
                      />
                    </div>

                    <SleekChart
                      kind="pie"
                      data={assetAllocation}
                      xKey="name"
                      series={[{ key: "value", label: "Allocation" }]}
                      title="Asset Allocation"
                      subtitle="Portfolio breakdown"
                      valueFormatter={(v) => `${v}%`}
                      compactHeight={140}
                    />

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm md:text-base">Top Holdings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2.5">
                          {topHoldings.map((holding) => (
                            <div key={holding.name} className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium text-sm">{holding.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{holding.fullName}</div>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-sm font-medium tabular-nums">${holding.value.toLocaleString()}</div>
                                <div className={`text-xs tabular-nums ${holding.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {holding.change >= 0 ? '+' : ''}{holding.change}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="trade" className="mt-0">
                  <TradeEntry />
                </TabsContent>
                
                <TabsContent value="holdings">
                  <LiveHoldings />
                </TabsContent>

                <TabsContent value="strategies">
                  <StrategyManager />
                </TabsContent>

                <TabsContent value="risk">
                  <RiskManager />
                </TabsContent>

                <TabsContent value="ibkr">
                  <IBKRConnection />
                </TabsContent>

                
                <TabsContent value="performance">
                  <SleekChart
                    kind="bar"
                    data={performance}
                    xKey="name"
                    series={[
                      { key: "portfolio", label: "Your Portfolio", color: "primary" },
                      { key: "benchmark", label: "Benchmark", hsl: "152 58% 48%" },
                    ]}
                    title="Portfolio Performance"
                    subtitle="Comparison against benchmark"
                    valueFormatter={(v) => `${v}%`}
                    compactHeight={140}
                    expandedHeight={360}
                  />
                </TabsContent>
                
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                      Transaction history coming soon
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
