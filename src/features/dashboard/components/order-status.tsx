"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Chờ XN", variant: "outline", color: "bg-amber-500" },
  confirmed: { label: "Đã XN", variant: "secondary", color: "bg-blue-500" },
  shipping: { label: "Đang giao", variant: "secondary", color: "bg-indigo-500" },
  completed: { label: "Xong", variant: "default", color: "bg-emerald-500" },
  cancelled: { label: "Hủy", variant: "destructive", color: "bg-red-500" },
};

export function OrderStatusBreakdown() {
  const { data, loading, error } = useDashboardDataContext();
  const breakdown = data?.orderStatusBreakdown ?? [];
  const total = breakdown.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="col-span-full sm:col-span-2 shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle>Trạng thái đơn hàng</CardTitle>
        <CardDescription>Phân bổ trạng thái của tất cả đơn hàng</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-destructive">{error}</div>
        ) : total === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</div>
        ) : (
          <div className="space-y-3">
            {breakdown.map((item) => {
              const cfg = statusConfig[item.status] ?? { label: item.status, variant: "outline" as const, color: "bg-muted" };
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${cfg.color}`} />
                      <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                    </div>
                    <span className="font-semibold tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cfg.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
