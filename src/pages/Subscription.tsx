import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, usePlans, useUpgradePlan } from "@/hooks/use-subscription";

export default function Subscription() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const upgradeMutation = useUpgradePlan();

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
              Current Plan: <span className="text-foreground">{subscription.planName}</span>
              <Badge variant="secondary" className="text-xs">
                Valid until {subscription.validUntil}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Invoices</span>
                <span className="font-medium">
                  {subscription.invoicesUsed} / {subscription.invoicesLimit}
                </span>
              </div>
              <Progress
                value={(subscription.invoicesUsed / subscription.invoicesLimit) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Users</span>
                <span className="font-medium">
                  {subscription.usersUsed} / {subscription.usersLimit}
                </span>
              </div>
              <Progress
                value={(subscription.usersUsed / subscription.usersLimit) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      {plans && plans.length > 0 && (
        <>
          <h3 className="mb-4 text-sm font-semibold">Available Plans</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = subscription?.planName === plan.name;
              return (
                <Card key={plan.id} className={isCurrent ? "ring-2 ring-accent" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold">
                      ₹{plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="mb-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 text-status-paid" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={!isOwner || upgradeMutation.isPending}
                        onClick={() => upgradeMutation.mutate(plan.id)}
                      >
                        {!isOwner
                          ? "Owner only"
                          : upgradeMutation.isPending
                            ? "Upgrading..."
                            : "Upgrade"}
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
