export type ProductType = "STOCK" | "SERVICE";

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  hsnCode?: string;
  unit?: string;
  sellingPrice: string;
  purchasePrice?: string;
  cgstRate: string;
  sgstRate: string;
  igstRate: string;
  currentStock: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  type: ProductType;
  hsnCode?: string;
  unit?: string;
  sellingPrice: string;
  purchasePrice?: string;
  cgstRate: string;
  sgstRate: string;
  igstRate: string;
}

export interface StockAdjustmentRequest {
  quantity: string;
  reason: string;
}

export type StockMovementType = "SALE" | "PURCHASE" | "ADJUSTMENT" | "RETURN";

export interface StockLedgerEntry {
  id: number;
  productId: number;
  productName: string;
  quantity: string;
  movementType: StockMovementType;
  referenceId?: number;
  referenceType?: string;
  reason?: string;
  createdAt: string;
}

export interface StockReportItem {
  id: number;
  name: string;
  type: ProductType;
  unit?: string;
  currentStock: string;
  sellingPrice: string;
}
