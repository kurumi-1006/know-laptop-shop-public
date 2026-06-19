import type { PrismaTx } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@/app/generated/prisma/enums";

export class OrderCancellationConflictError extends Error {}

type CancelOrderOptions = {
  allowedStatuses: OrderStatus[];
  userId?: string;
  paymentStatuses?: PaymentStatus[];
  paymentStatus?: PaymentStatus;
};

export async function cancelOrderAndReleaseResources(
  tx: PrismaTx,
  orderId: string,
  options: CancelOrderOptions,
) {
  const order = await tx.orders.findFirst({
    where: {
      id: orderId,
      ...(options.userId && { userId: options.userId }),
    },
    select: {
      id: true,
      status: true,
      couponId: true,
      orderDetails: {
        select: { productId: true, quantity: true },
      },
    },
  });

  if (!order) {
    throw new OrderCancellationConflictError("Order not found.");
  }

  if (order.status === OrderStatus.cancelled) {
    return tx.orders.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        orderDetails: true,
        user: { select: { id: true, name: true, email: true } },
        coupon: { select: { id: true, code: true } },
      },
    });
  }

  const claimed = await tx.orders.updateMany({
    where: {
      id: orderId,
      ...(options.userId && { userId: options.userId }),
      status: { in: options.allowedStatuses },
      ...(options.paymentStatuses && {
        paymentStatus: { in: options.paymentStatuses },
      }),
    },
    data: {
      status: OrderStatus.cancelled,
      ...(options.paymentStatus && {
        paymentStatus: options.paymentStatus,
      }),
    },
  });

  if (claimed.count !== 1) {
    const current = await tx.orders.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (current?.status === OrderStatus.cancelled) {
      return tx.orders.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          orderDetails: true,
          user: { select: { id: true, name: true, email: true } },
          coupon: { select: { id: true, code: true } },
        },
      });
    }

    throw new OrderCancellationConflictError(
      "Order state changed before cancellation.",
    );
  }

  for (const detail of order.orderDetails) {
    if (detail.productId) {
      await tx.product.update({
        where: { id: detail.productId },
        data: { stock: { increment: detail.quantity } },
      });
    }
  }

  if (order.couponId) {
    await tx.coupon.updateMany({
      where: { id: order.couponId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }

  return tx.orders.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      orderDetails: true,
      user: { select: { id: true, name: true, email: true } },
      coupon: { select: { id: true, code: true } },
    },
  });
}
