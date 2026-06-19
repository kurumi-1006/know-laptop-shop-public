import { apiClient } from "@/lib/axios";

export type OrderEntry = {
  id: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  total: number;
  receiverName: string;
  createdAt: string;
  user: { name?: string | null; email: string };
};

export type OrderListResponse = {
  data: OrderEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    shipping: number;
    completed: number;
    cancelled: number;
  };
};

export async function getOrders({
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
}): Promise<OrderListResponse> {
  const { data } = await apiClient.get<OrderListResponse>(
    "/api/admin/orders",
    {
      params: { page, pageSize, search, status, paymentStatus },
      headers: { "Cache-Control": "no-store" },
    },
  );
  return data;
}
