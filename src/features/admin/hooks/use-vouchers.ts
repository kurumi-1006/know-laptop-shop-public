import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { productsQueryKey } from "./use-products";

export const vouchersQueryKey = ["admin", "vouchers"] as const;

export function useVouchers(
  params: {
    page: number;
    pageSize: number;
    search: string;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...vouchersQueryKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/vouchers", { params });
      return data;
    },
    enabled: options?.enabled,
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data } = await apiClient.post("/api/admin/vouchers", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vouchersQueryKey });
    },
  });
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { data } = await apiClient.put(`/api/admin/vouchers/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vouchersQueryKey });
    },
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/api/admin/vouchers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vouchersQueryKey });
    },
  });
}

export function useAssignVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { voucherId?: string; productId?: string; productIds?: string[]; voucherIds?: string[] }) => {
      const { data } = await apiClient.post("/api/admin/vouchers/assign", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vouchersQueryKey });
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}

export function useRemoveVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ voucherId, productId }: { voucherId: string; productId: string }) => {
      const { data } = await apiClient.delete("/api/admin/vouchers/assign", {
        params: { voucherId, productId },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vouchersQueryKey });
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
  });
}
