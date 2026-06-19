import { OrderDetail } from "@/features/order/components/order-detail";
import { AccountNavigation } from "@/features/profile/components/account-navigation";
import { getCurrentSession } from "@/features/auth/lib/session";
import { OrderFacade } from "@/features/order/lib/order-facade";
import { FeedbackRepository } from "@/features/feedback/lib/feedback";
import prisma from "@/lib/prisma";
import { PackageIcon } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng | Know",
  description: "Xem chi tiết đơn hàng của bạn",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await getCurrentSession();
  if (!session || !session.user) {
    redirect("/login");
  }

  const { id } = await params;

  let order;
  try {
    order = await OrderFacade.getMyOrderDetail(session.user, id);
  } catch {
    notFound();
  }

  if (!order) notFound();


  const userFeedbacks = await FeedbackRepository.getUserFeedbacks(session.user.id);
  const feedbackMap = new Map(
    userFeedbacks.map((f) => [f.productId, { rating: f.rating, content: f.content }])
  );


  const completedOrders = await prisma.orders.findMany({
    where: {
      userId: session.user.id,
      status: "completed",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      orderDetails: {
        select: {
          productId: true,
        },
      },
    },
  });

  const latestOrderForProduct = new Map<string, string>();
  for (const completedOrder of completedOrders) {
    for (const detail of completedOrder.orderDetails) {
      if (detail.productId && !latestOrderForProduct.has(detail.productId)) {
        latestOrderForProduct.set(detail.productId, completedOrder.id);
      }
    }
  }

  const orderData = {
    ...order,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountTotal: Number(order.discountTotal),
    createdAt: order.createdAt.toISOString(),
    orderDetails: (order.orderDetails ?? []).map((d) => {
      const feedback = d.productId ? feedbackMap.get(d.productId) : null;
      return {
        ...d,
        unitPrice: Number(d.unitPrice),
        totalPrice: Number(d.totalPrice),
        reviewed: !!feedback,
        feedback: feedback ?? null,
        isLatestCompletedOrder: d.productId ? latestOrderForProduct.get(d.productId) === order.id : false,
      };
    }),
  };

  async function handleCancel(orderId: string) {
    "use server";
    try {
      await OrderFacade.cancelMyOrder(session!.user!, orderId);
      return { ok: true as const };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể hủy đơn hàng.";
      return { ok: false as const, error: message };
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <PackageIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chi tiết đơn hàng</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mã đơn: {order.orderCode}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AccountNavigation />
        <div className="min-w-0">
          <OrderDetail order={orderData} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
