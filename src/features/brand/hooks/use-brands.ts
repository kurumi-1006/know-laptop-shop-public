import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export const brandsQueryKey = ["brands"] as const;

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

export function useBrands(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: [...brandsQueryKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Brand[]; total: number }>("/api/brands", {
        params: {
          isActive: params?.isActive !== undefined ? params.isActive : true,
          pageSize: 100,
        },
      });
      return data.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
