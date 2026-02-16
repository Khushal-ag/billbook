export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  invoiceLimit: number;
  userLimit: number;
  storageLimitGb: number;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: number;
  planId: number;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  invoicesThisMonth: number;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscription {
  planId: number;
}
