export interface Alert {
  id: number;
  businessId: number;
  itemId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AlertListResponse {
  alerts: Alert[];
  count: number;
}
