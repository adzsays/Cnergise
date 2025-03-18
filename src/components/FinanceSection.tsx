
import React from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowUp, ArrowDown, DollarSign, CreditCard, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock financial data
const data = [
  { name: "Jan", amount: 2400 },
  { name: "Feb", amount: 2210 },
  { name: "Mar", amount: 2900 },
  { name: "Apr", amount: 3100 },
  { name: "May", amount: 2500 },
  { name: "Jun", amount: 3300 },
  { name: "Jul", amount: 3700 },
];

const accounts = [
  { name: "Main Account", balance: 8249.85, bank: "Chase", type: "checking" },
  { name: "Savings", balance: 12500.00, bank: "Wells Fargo", type: "savings" },
  { name: "Investment", balance: 32850.75, bank: "Vanguard", type: "investment" },
];

export function FinanceSection() {
  return (
    <CustomCard
      title="Finances"
      description="Track your financial health"
      className="h-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Balance
            </h3>
            <DollarSign className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            $53,600.60
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Across all accounts
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300">
              Income
            </h3>
            <ArrowUp className="h-4 w-4 text-green-700 dark:text-green-300" />
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            $8,540.32
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            +12.3% from last month
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-300">
              Expenses
            </h3>
            <ArrowDown className="h-4 w-4 text-red-700 dark:text-red-300" />
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            $4,210.50
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            -3.5% from last month
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Balance History</h3>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Connected Accounts</h3>
        <div className="space-y-3">
          {accounts.map((account, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    account.type === "checking"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : account.type === "savings"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  )}
                >
                  {account.type === "checking" ? (
                    <CreditCard className="h-5 w-5" />
                  ) : account.type === "savings" ? (
                    <PiggyBank className="h-5 w-5" />
                  ) : (
                    <DollarSign className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground">{account.bank}</p>
                </div>
              </div>
              <p className="font-medium">
                ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </CustomCard>
  );
}
