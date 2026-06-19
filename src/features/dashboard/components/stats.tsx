"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon, PackageCheckIcon, ClockIcon, UsersIcon, LaptopIcon } from "lucide-react";
import { formatCompactCurrency } from "@/lib/format-currency";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

export function DashboardStats() {
  const { data, loading, error } = useDashboardDataContext();

  if (error) {
    return (
      <Card className="col-span-full shadow-none dark:ring-0">
        <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (loading || !data) {
    return <StatSkeleton />;
  }

  const items = [
    { label: "Tổng doanh thu", value: formatCompactCurrency(data.stats.totalRevenue), icon: DollarSignIcon },
    { label: "Tổng đơn hàng", value: String(data.stats.totalOrders), icon: PackageCheckIcon },
    { label: "Đơn chờ xử lý", value: String(data.stats.pendingOrders), icon: ClockIcon },
    { label: "Khách hàng", value: String(data.stats.totalCustomers), icon: UsersIcon },
    { label: "Sản phẩm đang bán", value: String(data.stats.totalActiveProducts), icon: LaptopIcon },
  ];

  return (
    <>
      {items.map((item) => (
        <Card className="shadow-none dark:ring-0" key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-normal text-muted-foreground text-xs">
              {item.label}
            </CardTitle>
            <item.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function StatSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card className="shadow-none dark:ring-0" key={i}>
          <CardHeader>
            <CardTitle className="font-normal text-muted-foreground text-xs">
              &nbsp;
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl tabular-nums animate-pulse text-muted-foreground/20">
              000
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
