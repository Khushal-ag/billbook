import { useMemo } from "react";
import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, usePlans, useSubscribePlan } from "@/hooks/use-subscription";
import type { SubscriptionPlan } from "@/types/subscription";

export default function Subscription() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const subscribeMutation = useSubscribePlan();

  const plans = useMemo(() => plansData?.plans ?? [], [plansData?.plans]);

  // Look up the current plan by planId
  const currentPlan: SubscriptionPlan | undefined = useMemo(
    () => plans.find((p) => p.id === subscription?.planId),
    [plans, subscription?.planId],
  );

  if (subLoading || plansLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="mb-6 h-40 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
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
                {subscription.endDate ? `Valid until ${subscription.endDate}` : subscription.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Invoices this month</span>
                <span className="font-medium">
                  {subscription.invoicesThisMonth ?? 0} / {currentPlan?.invoiceLimit ?? "∞"}
                </span>
              </div>
              <Progress
                value={
                  currentPlan?.invoiceLimit
                    ? ((subscription.invoicesThisMonth ?? 0) / currentPlan.invoiceLimit) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Users</span>
                <span className="font-medium">
                  {subscription.usersCount ?? 0} / {currentPlan?.userLimit ?? "∞"}
                </span>
              </div>
              <Progress
                value={
                  currentPlan?.userLimit
                    ? ((subscription.usersCount ?? 0) / currentPlan.userLimit) * 100
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
                        Up to {plan.invoiceLimit} invoices/month
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-status-paid" />
                        Up to {plan.userLimit} users
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
