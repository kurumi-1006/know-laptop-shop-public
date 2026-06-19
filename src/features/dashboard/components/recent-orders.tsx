"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ XN", variant: "outline" },
  confirmed: { label: "Đã XN", variant: "secondary" },
  shipping: { label: "Đang giao", variant: "secondary" },
  completed: { label: "Xong", variant: "default" },
  cancelled: { label: "Hủy", variant: "destructive" },
};

export function RecentOrders() {
  const { data, loading, error } = useDashboardDataContext();
  const orders = data?.recentOrders ?? [];

  return (
    <Card className="col-span-full shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle>Đơn hàng gần đây</CardTitle>
        <CardDescription>10 đơn hàng mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Đang tải...</p>
        ) : error ? (
          <p className="text-sm text-destructive py-4 text-center">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const s = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.orderCode}</span>
                      <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.user?.name ?? order.user?.email} ·{" "}
                      {format(new Date(order.createdAt), "dd/MM HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{formatCurrency(order.total)}</span>
                    <ArrowRightIcon className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
