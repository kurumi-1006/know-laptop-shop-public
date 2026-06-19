import { describe, expect, it, vi } from "vitest";
import type { PrismaTx } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@/app/generated/prisma/enums";
import { cancelOrderAndReleaseResources } from "../lib/order-cancellation";

describe("cancelOrderAndReleaseResources", () => {
  it("only releases stock and coupon once when cancellation is repeated", async () => {
    let status: OrderStatus = OrderStatus.pending;
    const finalOrder = {
      id: "order-1",
      status: OrderStatus.cancelled,
      orderDetails: [],
      user: null,
      coupon: null,
    };

    const tx = {
      orders: {
        findFirst: vi.fn(async () => ({
          id: "order-1",
          status,
          couponId: "coupon-1",
          orderDetails: [{ productId: "product-1", quantity: 2 }],
        })),
        updateMany: vi.fn(async () => {
          if (status !== OrderStatus.pending) return { count: 0 };
          status = OrderStatus.cancelled;
          return { count: 1 };
        }),
        findUnique: vi.fn(async () => ({ status })),
        findUniqueOrThrow: vi.fn(async () => finalOrder),
      },
      product: {
        update: vi.fn(async () => ({ id: "product-1" })),
      },
      coupon: {
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    } as unknown as PrismaTx;

    const options = {
      allowedStatuses: [OrderStatus.pending],
      paymentStatuses: [PaymentStatus.unpaid],
      paymentStatus: PaymentStatus.failed,
    };

    await cancelOrderAndReleaseResources(tx, "order-1", options);
    await cancelOrderAndReleaseResources(tx, "order-1", options);

    expect(tx.orders.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.product.update).toHaveBeenCalledTimes(1);
    expect(tx.coupon.updateMany).toHaveBeenCalledTimes(1);
  });
});
