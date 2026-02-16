import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type {
  Product,
  ProductDetail,
  ProductListResponse,
  CreateProductRequest,
  StockAdjustmentRequest,
  StockMovement,
} from "@/types/product";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get<ProductListResponse>("/products");
      return res.data;
    },
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get<ProductDetail>(`/products/${id}`);
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
      const res = await api.get<StockMovement[]>(`/products/${productId}/ledger`);
      return res.data;
    },
    enabled: !!productId,
  });
}

export function useStockReport() {
  return useQuery({
    queryKey: ["stock-report"],
    queryFn: async () => {
      const res = await api.get<unknown>("/products/stock/report");
      return res.data;
    },
  });
}
