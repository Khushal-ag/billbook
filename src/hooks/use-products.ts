import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { buildQueryString } from "@/lib/utils";
import type {
  Product,
  CreateProductRequest,
  StockAdjustmentRequest,
  StockLedgerEntry,
  StockReportItem,
} from "@/types/product";
import type { PaginatedResponse } from "@/types/api";

export function useProducts(
  params: { page?: number; pageSize?: number; includeDeleted?: boolean } = {},
) {
  const { page = 1, pageSize = 50, includeDeleted = false } = params;
  const qs = buildQueryString({
    page,
    pageSize,
    includeDeleted: includeDeleted || undefined,
  });

  return useQuery({
    queryKey: ["products", page, pageSize, includeDeleted],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Product>>(`/products?${qs}`);
      return res.data;
    },
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get<Product>(`/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      const res = await api.post<Product>("/products", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateProductRequest>) => {
      const res = await api.put<Product>(`/products/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useAdjustStock(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: StockAdjustmentRequest) => {
      const res = await api.post(`/products/${productId}/adjust-stock`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["stock-ledger", productId] });
    },
  });
}

export function useStockLedger(productId: number | undefined) {
  return useQuery({
    queryKey: ["stock-ledger", productId],
    queryFn: async () => {
      const res = await api.get<StockLedgerEntry[]>(`/products/${productId}/ledger`);
      return res.data;
    },
    enabled: !!productId,
  });
}

export function useStockReport() {
  return useQuery({
    queryKey: ["stock-report"],
    queryFn: async () => {
      const res = await api.get<StockReportItem[]>("/products/stock/report");
      return res.data;
    },
  });
}
