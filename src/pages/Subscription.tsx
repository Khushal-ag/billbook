import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import SubscriptionSkeleton from "@/components/skeletons/SubscriptionSkeleton";
import { CurrentPlanCard, PlansGrid } from "@/components/subscription/SubscriptionSections";
import { usePermissions } from "@/hooks/use-permissions";
import { useSubscription, usePlans, useSubscribePlan } from "@/hooks/use-subscription";
import type { SubscriptionPlan } from "@/types/subscription";

export default function Subscription() {
  const { isOwner } = usePermissions();

  const { data: subscription, isPending: subPending } = useSubscription();
  const { data: plansData, isPending: plansPending } = usePlans();
  const subscribeMutation = useSubscribePlan();

  const plans = useMemo(() => plansData?.plans ?? [], [plansData?.plans]);

  const currentPlan: SubscriptionPlan | undefined = useMemo(
    () => plans.find((p) => p.id === subscription?.planId),
    [plans, subscription?.planId],
  );

  if (subPending || plansPending) {
    return <SubscriptionSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none select-none blur-md">
          <div className="page-header">
            <h1 className="page-title">Subscription</h1>
            <p className="page-description">Manage your plan and usage</p>
          </div>

          {subscription && (
            <CurrentPlanCard subscription={subscription} currentPlan={currentPlan} />
          )}

          {plans.length > 0 && (
            <PlansGrid
              plans={plans}
              currentPlanId={subscription?.planId}
              isOwner={isOwner}
              isSubscribing={subscribeMutation.isPending}
              onSubscribe={(planId) => subscribeMutation.mutate(planId)}
            />
          )}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card/95 px-8 py-10 shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Coming soon</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Subscription management will be available here shortly.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              We&apos;re working on it
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
