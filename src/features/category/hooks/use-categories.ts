import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export const categoriesQueryKey = ["categories"] as const;

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: number | null;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

export function useCategories(params?: { isActive?: boolean; parentId?: number }) {
  return useQuery({
    queryKey: [...categoriesQueryKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Category[]; total: number }>("/api/categories", {
        params: {
          isActive: params?.isActive !== undefined ? params.isActive : true,
          parentId: params?.parentId,
          pageSize: 100,
        },
      });
      return data.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function usePopularCategories(limit: number = 3) {
  return useQuery({
    queryKey: [...categoriesQueryKey, "popular", limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Category[] }>("/api/categories/popular", {
        params: { limit },
      });
      return data.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

