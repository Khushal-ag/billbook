import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { Subscription, Plan } from "@/types/subscription";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.get<Subscription>("/subscriptions");
      return res.data;
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await api.get<Plan[]>("/subscriptions/plans");
      return res.data;
    },
  });
}

export function useUpgradePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: number) => {
      const res = await api.post("/subscriptions", { planId });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}
