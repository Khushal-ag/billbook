import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import type { Subscription, SubscriptionPlan } from "@/types/subscription";

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.subscription.current(),
    queryFn: async () => {
      const res = await api.get<{ subscription: Subscription; plan: SubscriptionPlan }>(
        "/subscriptions/current",
      );
      return res.data.subscription;
    },
    retry: false,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.subscription.plans(),
    queryFn: async () => {
      const res = await api.get<{ plans: SubscriptionPlan[] }>("/subscriptions/plans");
      return res.data;
    },
    retry: false,
  });
}

export function useSubscribePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: number) => {
      const res = await api.post("/subscriptions", { planId });
      return res.data;
    },
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.subscription.current()]),
  });
}
