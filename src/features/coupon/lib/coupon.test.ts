import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    coupon: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    productCoupon: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { CouponFacade } from "./coupon";
import { DiscountType } from "@/app/generated/prisma/client";

describe("CouponFacade Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should reject when duplicate coupon code is found", async () => {
      (prisma.coupon.findUnique as any).mockResolvedValue({
        id: "cp-1",
        code: "SALE10",
      });

      await expect(
        CouponFacade.create({
          code: "sale10",
          discountType: "percent" as DiscountType,
          discountValue: 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          minOrderValue: 0,
        })
      ).rejects.toThrow("Coupon with code SALE10 already exists.");
    });
  });

  describe("validate", () => {
    it("should validate and apply correct percentage discount up to max value", async () => {
      const now = new Date();
      (prisma.coupon.findUnique as any).mockResolvedValue({
        id: "cp-1",
        code: "BIGSALE",
        discountType: "percent" as DiscountType,
        discountValue: 10,
        minOrderValue: 200000,
        maxDiscountValue: 50000,
        startDate: new Date(now.getTime() - 3600000),
        endDate: new Date(now.getTime() + 3600000),
        isActive: true,
        isDeleted: false,
        quantity: 10,
        usedCount: 0,
      });

      (prisma.productCoupon.findMany as any).mockResolvedValue([]);


      const result = await CouponFacade.validate("BIGSALE", 1000000);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(50000);
    });

    it("should restrict product-scoped coupon only to eligible items in cart", async () => {
      const now = new Date();
      (prisma.coupon.findUnique as any).mockResolvedValue({
        id: "cp-1",
        code: "LAPTOPSALE",
        discountType: "percent" as DiscountType,
        discountValue: 10,
        minOrderValue: 200000,
        maxDiscountValue: null,
        startDate: new Date(now.getTime() - 3600000),
        endDate: new Date(now.getTime() + 3600000),
        isActive: true,
        isDeleted: false,
        quantity: 10,
        usedCount: 0,
      });


      (prisma.productCoupon.findMany as any).mockResolvedValue([
        { couponId: "cp-1", productId: "product-1" },
      ]);

      const cartItems = [
        { productId: "product-1", price: 200000, quantity: 1 },
        { productId: "product-2", price: 300000, quantity: 1 },
      ];


      const result = await CouponFacade.validate("LAPTOPSALE", 500000, cartItems);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(20000);
    });

    it("should reject coupon when order value is below minOrderValue", async () => {
      const now = new Date();
      (prisma.coupon.findUnique as any).mockResolvedValue({
        id: "cp-1",
        code: "MIN500",
        discountType: "amount" as DiscountType,
        discountValue: 50000,
        minOrderValue: 500000,
        maxDiscountValue: null,
        startDate: new Date(now.getTime() - 3600000),
        endDate: new Date(now.getTime() + 3600000),
        isActive: true,
        isDeleted: false,
        quantity: 10,
        usedCount: 0,
      });

      (prisma.productCoupon.findMany as any).mockResolvedValue([]);

      const result = await CouponFacade.validate("MIN500", 400000);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("Đơn hàng tối thiểu cần đạt 500.000 VND");
    });
  });
});
