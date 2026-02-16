export type ProductType = "STOCK" | "SERVICE";

export interface Product {
  id: number;
  businessId: number;
  name: string;
  type: ProductType;
  hsnCode: string | null;
  sacCode: string | null;
  unit: string;
  description: string | null;
  sellingPrice: string | null;
  purchasePrice: string | null;
  cgstRate: string | null;
  sgstRate: string | null;
  igstRate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** GET /products/:id — includes current stock */
export interface ProductDetail extends Product {
  currentStock: number;
}

export interface CreateProductRequest {
  name: string;
  type: ProductType;
  hsnCode?: string;
  sacCode?: string;
  unit?: string;
  description?: string;
  sellingPrice?: string;
  purchasePrice?: string;
  cgstRate?: string;
  sgstRate?: string;
  igstRate?: string;
}

export interface StockAdjustmentRequest {
  quantity: string;
  reason: string;
}

export type StockMovementType = "SALE" | "PURCHASE" | "ADJUSTMENT" | "RETURN";

export interface StockMovement {
  id: number;
  businessId: number;
  productId: number;
  movementType: StockMovementType;
  quantity: string;
  referenceId: number | null;
  referenceType: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

/** GET /products response */
export interface ProductListResponse {
  products: Product[];
  count: number;
}
