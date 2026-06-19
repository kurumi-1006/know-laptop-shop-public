import { getOrders } from "@/features/admin/api/orders";
import { useQuery } from "@tanstack/react-query";

export const ordersQueryKey = ["admin", "orders"] as const;

export function useOrders({
  page,
  pageSize,
  search,
  status,
  paymentStatus,
}: {
  page: number;
  pageSize: number;
  search: string;
  status: string;
  paymentStatus: string;
}) {
  return useQuery({
    queryKey: [...ordersQueryKey, page, pageSize, search, status, paymentStatus],
    queryFn: () => getOrders({ page, pageSize, search, status, paymentStatus }),
  });
}
