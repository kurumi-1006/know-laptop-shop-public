import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export const productsQueryKey = ["admin", "products"] as const;
export const brandsQueryKey = ["admin", "brands"] as const;
export const categoriesQueryKey = ["admin", "categories"] as const;

export function useProducts(
  params: {
    page: number;
    pageSize: number;
    search: string;
    status: string;
    categoryId: string;
    brandId: string;
    sortBy: string;
    sortOrder: string;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...productsQueryKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/products", { params });
      return data;
    },
    enabled: options?.enabled,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/products/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data } = await apiClient.post("/api/admin/products", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { data } = await apiClient.put(`/api/admin/products/${id}`, values);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["admin", "product", variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/api/admin/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, formData }: { productId: string; formData: FormData }) => {
      const { data } = await apiClient.post(`/api/admin/products/${productId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const { data } = await apiClient.delete(`/api/admin/products/${productId}/images`, {
        params: { imageId },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useSetProductPrimaryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const { data } = await apiClient.put(`/api/admin/products/${productId}/images`, { imageId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: brandsQueryKey,
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/brands");
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/categories");
      return data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; description?: string | null; parentId?: number | null }) => {
      const { data } = await apiClient.post("/api/admin/categories", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Record<string, unknown> }) => {
      const { data } = await apiClient.put(`/api/admin/categories/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/api/admin/categories/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; logo?: string | null; description?: string | null }) => {
      const { data } = await apiClient.post("/api/admin/brands", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { data } = await apiClient.put(`/api/admin/brands/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/api/admin/brands/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey });
    },
  });
}
