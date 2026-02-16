import { useMemo } from "react";
import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import SubscriptionSkeleton from "@/components/skeletons/SubscriptionSkeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useSubscription, usePlans, useSubscribePlan } from "@/hooks/use-subscription";
import type { SubscriptionPlan } from "@/types/subscription";

export default function Subscription() {
  const { isOwner } = usePermissions();

  const { data: subscription, isPending: subPending } = useSubscription();
  const { data: plansData, isPending: plansPending } = usePlans();
  const subscribeMutation = useSubscribePlan();

  const plans = useMemo(() => plansData?.plans ?? [], [plansData?.plans]);

  // Look up the current plan by planId
  const currentPlan: SubscriptionPlan | undefined = useMemo(
    () => plans.find((p) => p.id === subscription?.planId),
    [plans, subscription?.planId],
  );

  if (subPending || plansPending) {
    return <SubscriptionSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Subscription</h1>
        <p className="page-description">Manage your plan and usage</p>
      </div>

      {/* Current Usage */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Current Plan:{" "}
              <span className="text-foreground">{currentPlan?.name ?? "Unknown"}</span>
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
      )}

      {/* Plans */}
      {plans.length > 0 && (
        <>
          <h3 className="mb-4 text-sm font-semibold">Available Plans</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = subscription?.planId === plan.id;
              return (
                <Card key={plan.id} className={isCurrent ? "ring-2 ring-accent" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold">
                      ₹{plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="mb-4 space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-status-paid" />
                        {plan.invoiceLimit === -1
                          ? "Unlimited invoices/month"
                          : `Up to ${plan.invoiceLimit} invoices/month`}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-status-paid" />
                        {plan.userLimit === -1
                          ? "Unlimited users"
                          : `Up to ${plan.userLimit} users`}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-status-paid" />
                        {plan.storageLimitGb} GB storage
                      </li>
                    </ul>
                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={!isOwner || subscribeMutation.isPending}
                        onClick={() => subscribeMutation.mutate(plan.id)}
                      >
                        {!isOwner
                          ? "Owner only"
                          : subscribeMutation.isPending
                            ? "Subscribing..."
                            : "Subscribe"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
