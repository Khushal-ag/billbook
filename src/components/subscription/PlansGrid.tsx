import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionPlan } from "@/types/subscription";

interface PlansGridProps {
  plans: SubscriptionPlan[];
  currentPlanId?: number | null;
  isOwner: boolean;
  isSubscribing: boolean;
  onSubscribe: (planId: number) => void;
}

export function PlansGrid({
  plans,
  currentPlanId,
  isOwner,
  isSubscribing,
  onSubscribe,
}: PlansGridProps) {
  return (
    <>
      <h3 className="mb-4 text-sm font-semibold">Available Plans</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
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
                    {plan.userLimit === -1 ? "Unlimited users" : `Up to ${plan.userLimit} users`}
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
                    disabled={!isOwner || isSubscribing}
                    onClick={() => onSubscribe(plan.id)}
                  >
                    {!isOwner ? "Owner only" : isSubscribing ? "Subscribing..." : "Subscribe"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
