import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionPlan, Subscription } from "@/types/subscription";

interface CurrentPlanCardProps {
  subscription: Subscription;
  currentPlan?: SubscriptionPlan;
}

export function CurrentPlanCard({ subscription, currentPlan }: CurrentPlanCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          Current Plan: <span className="text-foreground">{currentPlan?.name ?? "Unknown"}</span>
          <Badge variant="secondary" className="text-xs">
            {subscription.status === "ACTIVE"
              ? `Valid until ${new Date(subscription.endDate).toLocaleDateString()}`
              : subscription.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Invoices this month</span>
            <span className="font-medium">
              {subscription.invoicesThisMonth} /{" "}
              {!currentPlan || currentPlan.invoiceLimit === -1 ? "∞" : currentPlan.invoiceLimit}
            </span>
          </div>
          <Progress
            value={
              currentPlan && currentPlan.invoiceLimit > 0
                ? (subscription.invoicesThisMonth / currentPlan.invoiceLimit) * 100
                : 0
            }
            className="h-2"
          />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Users</span>
            <span className="font-medium">
              {subscription.usersCount} /{" "}
              {!currentPlan || currentPlan.userLimit === -1 ? "∞" : currentPlan.userLimit}
            </span>
          </div>
          <Progress
            value={
              currentPlan && currentPlan.userLimit > 0
                ? (subscription.usersCount / currentPlan.userLimit) * 100
                : 0
            }
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
