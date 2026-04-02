import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { ApiClientError } from "@/api/error";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import type { Subscription, SubscriptionPlan } from "@/types/subscription";

/** Backend returns 404 / NOT_FOUND when the business has never had an active subscription. */
function isNoCurrentSubscriptionError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;
  if (error.status === 404) return true;
  const msg = error.message.toLowerCase();
  if (msg.includes("no active subscription")) return true;
  const d = error.details as { code?: string } | undefined;
  return d?.code === "NOT_FOUND";
}

type SubscriptionQueryOptions = { enabled?: boolean };

export function useSubscription(options?: SubscriptionQueryOptions) {
  return useQuery({
    queryKey: queryKeys.subscription.current(),
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<Subscription | null> => {
      try {
        const res = await api.get<{ subscription: Subscription; plan: SubscriptionPlan }>(
          "/subscriptions/current",
        );
        return res.data.subscription;
      } catch (e) {
        if (isNoCurrentSubscriptionError(e)) {
          return null;
        }
        throw e;
      }
    },
    retry: false,
  });
}

type PlansQueryOptions = { enabled?: boolean };

export function usePlans(options?: PlansQueryOptions) {
  return useQuery({
    queryKey: queryKeys.subscription.plans(),
    enabled: options?.enabled ?? true,
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
