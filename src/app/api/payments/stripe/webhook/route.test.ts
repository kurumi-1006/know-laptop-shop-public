import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/payment/lib/stripe-service", () => ({
  StripeService: {
    constructEvent: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    orders: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/features/order/lib/order-repository", () => ({
  OrderRepository: {
    updateStatus: vi.fn(),
  },
}));

import prisma from "@/lib/prisma";
import { StripeService } from "@/features/payment/lib/stripe-service";
import { POST } from "./route";

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 so Stripe retries when database processing fails", async () => {
    (StripeService.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "checkout.session.expired",
      data: {
        object: {
          id: "cs_test",
          metadata: { orderCode: "ORD-1" },
        },
      },
    });
    (prisma.orders.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "order-1",
      status: "pending",
      paymentStatus: "unpaid",
    });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("database unavailable"),
    );

    const request = new Request("http://localhost/api/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "signature" },
      body: "{}",
    });

    const response = await POST(request as never);

    expect(response.status).toBe(500);
  });
});
