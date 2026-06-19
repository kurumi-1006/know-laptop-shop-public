"use client";

import { useEffect, useState, useCallback } from "react";
import { useDashboardDate } from "./use-dashboard-date";

interface DashboardData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    totalActiveProducts: number;
  };
  topProducts: Array<{
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      salePrice: number | null;
      images: { imageUrl: string }[];
    };
    totalSold: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
    price: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderCode: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    user: { name?: string | null; email: string };
  }>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  recentFeedbacks: Array<{
    id: string;
    rating: number;
    content: string | null;
    createdAt: string;
    user: { name: string; email: string };
    product: { id: string; name: string; slug: string };
  }>;
}





export function useDashboardData() {
  const { dateRange } = useDashboardDate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);

    fetch(`/api/admin/dashboard/stats?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((res) => setData(res as DashboardData))
      .catch((err) => {
        console.error("Dashboard data fetch failed", err);
        setError("Không thể tải dữ liệu dashboard.");
      })
      .finally(() => setLoading(false));
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
