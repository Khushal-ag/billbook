export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIAL";

export interface Subscription {
  id: number;
  planName: string;
  invoicesUsed: number;
  invoicesLimit: number;
  usersUsed: number;
  usersLimit: number;
  validUntil: string;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface Plan {
  id: number;
  name: string;
  price: string;
  invoicesLimit: number;
  usersLimit: number;
  features: string[];
}
