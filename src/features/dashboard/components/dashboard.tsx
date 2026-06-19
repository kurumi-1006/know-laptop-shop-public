"use client";

import { DashboardStats } from "@/features/dashboard/components/stats";
import { RecentOrders } from "@/features/dashboard/components/recent-orders";
import { TopProducts } from "@/features/dashboard/components/top-products";
import { LowStockProducts } from "@/features/dashboard/components/low-stock-products";
import { TeamOnDuty } from "@/features/dashboard/components/team-on-duty";
import { RevenueChart } from "@/features/dashboard/components/revenue-chart";
import { OrderStatusBreakdown } from "@/features/dashboard/components/order-status";
import { RecentFeedbacks } from "@/features/dashboard/components/recent-feedbacks";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import {
  type DashboardWidget,
} from "@/features/dashboard/lib/dashboard-facade";
import { DashboardDataProvider, useDashboardDataContext } from "@/features/dashboard/hooks/dashboard-data-context";

const widgetComponents: Record<DashboardWidget, React.ComponentType> = {
  "stats": DashboardStats,
  "recent-orders": RecentOrders,
  "top-products": TopProducts,
  "low-stock-products": LowStockProducts,
  "team": TeamOnDuty,
  "revenue-chart": RevenueChart,
  "order-status": OrderStatusBreakdown,
  "recent-feedbacks": RecentFeedbacks,
};

function DashboardGrid({ widgets }: { widgets: readonly DashboardWidget[] }) {
  const { loading } = useDashboardDataContext();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {widgets.map((widget) => {
        const Widget = widgetComponents[widget];
        return <Widget key={widget} />;
      })}
    </div>
  );
}

export function Dashboard({ widgets }: { widgets: readonly DashboardWidget[] }) {
  return (
    <DashboardDataProvider>
      <DashboardGrid widgets={widgets} />
    </DashboardDataProvider>
  );
}
