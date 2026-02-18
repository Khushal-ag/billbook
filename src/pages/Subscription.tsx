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
      {subscription && <CurrentPlanCard subscription={subscription} currentPlan={currentPlan} />}

      {/* Plans */}
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
  );
}
