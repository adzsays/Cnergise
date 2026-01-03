import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "inactive" | "trial";
  price: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate?: string;
  features: string[];
  color: string;
}

const subscriptions: Subscription[] = [
  {
    id: "ai-agent",
    name: "AI Assistant Pro",
    description: "Advanced AI capabilities with unlimited queries and priority processing",
    icon: Brain,
    status: "trial",
    price: "£9.99",
    billingCycle: "monthly",
    nextBillingDate: "2025-02-03",
    features: [
      "Unlimited AI queries",
      "Priority processing",
      "Advanced analytics",
      "Custom AI training"
    ],
    color: "text-primary"
  },
  {
    id: "premium",
    name: "Cnergise Premium",
    description: "Full access to all premium features and integrations",
    icon: Zap,
    status: "inactive",
    price: "£19.99",
    billingCycle: "monthly",
    features: [
      "All free features",
      "Unlimited projects",
      "Advanced reporting",
      "Priority support",
      "Custom integrations"
    ],
    color: "text-accent"
  },
  {
    id: "finance-pro",
    name: "Finance Pro",
    description: "Advanced financial tracking with bank integrations",
    icon: TrendingUp,
    status: "inactive",
    price: "£14.99",
    billingCycle: "monthly",
    features: [
      "Bank account sync",
      "Investment tracking",
      "Tax reporting",
      "Budget forecasting"
    ],
    color: "text-finance"
  },
  {
    id: "security-plus",
    name: "Security Plus",
    description: "Enhanced security features and data protection",
    icon: Shield,
    status: "inactive",
    price: "£4.99",
    billingCycle: "monthly",
    features: [
      "Two-factor authentication",
      "Encrypted backups",
      "Audit logs",
      "Data export"
    ],
    color: "text-success"
  }
];

export function SubscriptionSettings() {
  const [autoRenew, setAutoRenew] = useState<Record<string, boolean>>({
    "ai-agent": true,
  });

  const handleSubscribe = (subscriptionId: string) => {
    toast.info("Subscription management coming soon!", {
      description: "Payment integration will be available shortly."
    });
  };

  const handleCancel = (subscriptionId: string) => {
    toast.info("Cancellation requested", {
      description: "Your subscription will remain active until the end of the billing period."
    });
  };

  const handleManageBilling = () => {
    toast.info("Opening billing portal...", {
      description: "Payment integration will be available shortly."
    });
  };

  const getStatusBadge = (status: Subscription["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "trial":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Trial</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === "active" || s.status === "trial");
  const availableSubscriptions = subscriptions.filter(s => s.status === "inactive");

  return (
    <div className="space-y-6">
      {/* Billing Overview */}
      <Card className="bg-card border border-border">
        <CardHeader className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Billing Overview</CardTitle>
              <CardDescription className="text-sm">Manage your payment methods and billing</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleManageBilling}>
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">No payment method added</p>
              <p className="text-xs text-muted-foreground">Add a payment method to subscribe to premium features</p>
            </div>
            <Button size="sm">Add Card</Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <Card className="bg-card border border-border">
          <CardHeader className="px-4 py-4 md:px-6">
            <CardTitle className="text-base font-medium">Active Subscriptions</CardTitle>
            <CardDescription className="text-sm">Your current active plans</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 space-y-4">
            {activeSubscriptions.map((sub) => (
              <div key={sub.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
                      <sub.icon className={`h-5 w-5 ${sub.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{sub.name}</h3>
                        {getStatusBadge(sub.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{sub.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{sub.price}<span className="text-sm font-normal text-muted-foreground">/{sub.billingCycle === "monthly" ? "mo" : "yr"}</span></p>
                  </div>
                </div>

                {sub.nextBillingDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {sub.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`auto-renew-${sub.id}`}
                      checked={autoRenew[sub.id] ?? false}
                      onCheckedChange={(checked) => setAutoRenew(prev => ({ ...prev, [sub.id]: checked }))}
                    />
                    <Label htmlFor={`auto-renew-${sub.id}`} className="text-sm">Auto-renew</Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCancel(sub.id)}>
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available Subscriptions */}
      <Card className="bg-card border border-border">
        <CardHeader className="px-4 py-4 md:px-6">
          <CardTitle className="text-base font-medium">Available Plans</CardTitle>
          <CardDescription className="text-sm">Upgrade your experience with premium features</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {availableSubscriptions.map((sub) => (
              <div key={sub.id} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
                    <sub.icon className={`h-5 w-5 ${sub.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{sub.name}</h3>
                    <p className="text-lg font-semibold">{sub.price}<span className="text-sm font-normal text-muted-foreground">/{sub.billingCycle === "monthly" ? "mo" : "yr"}</span></p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{sub.description}</p>

                <ul className="space-y-1.5 mb-4">
                  {sub.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {sub.features.length > 3 && (
                    <li className="text-sm text-muted-foreground">+{sub.features.length - 3} more features</li>
                  )}
                </ul>

                <Button className="w-full" onClick={() => handleSubscribe(sub.id)}>
                  Subscribe
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card className="bg-card border border-border">
        <CardHeader className="px-4 py-4 md:px-6">
          <CardTitle className="text-base font-medium">AI Usage</CardTitle>
          <CardDescription className="text-sm">Track your AI assistant usage this month</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Queries used</span>
              <span className="text-sm font-medium">47 / 100</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: "47%" }} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Usage resets on the 1st of each month
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
