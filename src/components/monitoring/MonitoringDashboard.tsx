import { useState } from "react";
import { useErrorLogging, usePerformanceMonitoring } from "@/hooks/useMonitoring";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Activity, DollarSign, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export function MonitoringDashboard() {
  const { errorLogs, isLoadingErrors, deleteErrorLog } = useErrorLogging();
  const { performanceMetrics, usageStats, isLoadingMetrics, isLoadingUsage } = usePerformanceMonitoring();
  const [activeTab, setActiveTab] = useState("errors");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const totalErrors = errorLogs.length;
  const criticalErrors = errorLogs.filter(e => e.severity === 'critical').length;
  const avgResponseTime = performanceMetrics.length > 0
    ? Math.round(performanceMetrics.reduce((acc, m) => acc + m.execution_time_ms, 0) / performanceMetrics.length)
    : 0;
  const totalCost = usageStats.reduce((acc, s) => acc + Number(s.estimated_cost_units), 0);
  const successRate = performanceMetrics.length > 0
    ? Math.round((performanceMetrics.filter(m => m.success).length / performanceMetrics.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {criticalErrors} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.length} operations tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 100 operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Cost Units</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Details</CardTitle>
          <CardDescription>View error logs, performance metrics, and usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="errors" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Errors ({totalErrors})
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Usage & Costs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="mt-4">
              {isLoadingErrors ? (
                <div className="text-center py-8 text-muted-foreground">Loading errors...</div>
              ) : errorLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No errors logged</div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {log.error_message}
                          </TableCell>
                          <TableCell>{log.component || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteErrorLog.mutate(log.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              {isLoadingMetrics ? (
                <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
              ) : performanceMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No performance data yet</div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Operation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceMetrics.map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell>
                            {metric.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>{metric.operation_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{metric.operation_type}</Badge>
                          </TableCell>
                          <TableCell>{metric.table_name || '-'}</TableCell>
                          <TableCell>{metric.execution_time_ms}ms</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(metric.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="usage" className="mt-4">
              {isLoadingUsage ? (
                <div className="text-center py-8 text-muted-foreground">Loading usage stats...</div>
              ) : usageStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No usage data yet</div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Operation Type</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Total Time</TableHead>
                        <TableHead>Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageStats.map((stat) => (
                        <TableRow key={stat.id}>
                          <TableCell>{format(new Date(stat.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stat.operation_type}</Badge>
                          </TableCell>
                          <TableCell>{stat.operation_count}</TableCell>
                          <TableCell>{stat.total_time_ms}ms</TableCell>
                          <TableCell>${Number(stat.estimated_cost_units).toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
