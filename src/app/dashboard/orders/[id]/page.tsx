import { AdminOrderDetail } from "@/features/admin/components/order-detail";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { OrderFacade } from "@/features/order/lib/order-facade";
import { isStaff } from "@/lib/roles";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng | Know Dashboard",
  description: "Chi tiết và quản lý trạng thái đơn hàng",
};

export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <DashboardOrderDetailContent params={params} />
    </Suspense>
  );
}

async function DashboardOrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await getCurrentSession();

  if (!session || !isStaff(session.user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  let order;
  try {
    order = await OrderFacade.getOrderDetail(session.user, id);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const orderData = {
    ...order,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountTotal: Number(order.discountTotal),
    createdAt: order.createdAt.toISOString(),
    orderDetails: (order.orderDetails ?? []).map((d) => ({
      ...d,
      unitPrice: Number(d.unitPrice),
      totalPrice: Number(d.totalPrice),
    })),
  };

  return (
    <AppShell>
      <AdminOrderDetail order={orderData} />
    </AppShell>
  );
}
