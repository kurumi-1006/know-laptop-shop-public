import { useQuery } from "@tanstack/react-query";
import { getProducts, type GetProductsParams } from "../api/products";

export const productsQueryKey = ["products"] as const;

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: [...productsQueryKey, params],
    queryFn: () => getProducts(params),
    staleTime: 1000 * 60 * 2,
  });
}
