import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    coupon: {
      findUnique: vi.fn(),
    },
    productCoupon: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { CouponFacade } from "../lib/coupon";

describe("CouponFacade.validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a soft-deleted coupon even when it is still active", async () => {
    (prisma.coupon.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "coupon-1",
      code: "DELETED",
      isActive: true,
      isDeleted: true,
    });

    const result = await CouponFacade.validate("DELETED", 1_000_000);

    expect(result.valid).toBe(false);
    expect(prisma.productCoupon.findMany).not.toHaveBeenCalled();
  });
});
