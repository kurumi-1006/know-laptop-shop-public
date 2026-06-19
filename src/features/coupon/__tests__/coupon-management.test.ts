import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    coupon: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productCoupon: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    default: mockPrisma,
  };
});

import prisma from "@/lib/prisma";
import { CouponFacade, CouponRepository } from "../lib/coupon";
import { DiscountType } from "@/app/generated/prisma/client";

describe("Coupon Management (CouponFacade & CouponRepository)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: Function) => fn(prisma)
    );
  });

  describe("createCoupon", () => {
    it("should successfully create a coupon and convert the code to uppercase", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null);

      const mockCreatedCoupon = {
        id: "coupon-123",
        code: "SALE50",
        discountType: DiscountType.percent,
        discountValue: 50,
        startDate: new Date(),
        endDate: new Date(),
        minOrderValue: 100000,
        quantity: 100,
      };
      vi.mocked(prisma.coupon.create).mockResolvedValue(mockCreatedCoupon as any);

      const input = {
        code: "sale50",
        discountType: DiscountType.percent,
        discountValue: 50,
        startDate: new Date(),
        endDate: new Date(),
        minOrderValue: 100000,
        quantity: 100,
      };

      const result = await CouponFacade.create(input);

      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: "SALE50" },
      });
      expect(prisma.coupon.create).toHaveBeenCalledWith({
        data: {
          ...input,
          code: "SALE50",
          minOrderValue: 100000,
          quantity: 100,
        },
      });
      expect(result).toEqual(mockCreatedCoupon);
    });

    it("should throw error if coupon code already exists", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: "existing-id" } as any);

      const input = {
        code: "SALE50",
        discountType: DiscountType.percent,
        discountValue: 50,
        startDate: new Date(),
        endDate: new Date(),
      };

      await expect(CouponFacade.create(input)).rejects.toThrow(
        "Coupon with code SALE50 already exists."
      );
    });
  });

  describe("updateCoupon", () => {
    it("should update a coupon and format code to uppercase if provided", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: "coupon-1" } as any);
      const mockUpdated = { id: "coupon-1", code: "NEWCODE" };
      vi.mocked(prisma.coupon.update).mockResolvedValue(mockUpdated as any);

      const result = await CouponFacade.update("coupon-1", { code: "newcode" });

      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: "coupon-1" },
        data: { code: "NEWCODE" },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe("deleteCoupon", () => {
    it("should delete coupon if it exists", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: "coupon-1" } as any);
      vi.mocked(prisma.coupon.delete).mockResolvedValue({ id: "coupon-1" } as any);

      const result = await CouponFacade.delete("coupon-1");

      expect(prisma.coupon.delete).toHaveBeenCalledWith({
        where: { id: "coupon-1" },
      });
      expect(result).toEqual({ id: "coupon-1" });
    });
  });

  describe("linkCouponToProducts", () => {
    it("should delete old product links and create new ones in a transaction", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: "coupon-1" } as any);
      vi.mocked(prisma.productCoupon.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.productCoupon.createMany).mockResolvedValue({ count: 2 } as any);

      await CouponFacade.linkProducts("coupon-1", ["prod-1", "prod-2"]);

      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { id: "coupon-1" },
      });
      expect(prisma.productCoupon.deleteMany).toHaveBeenCalledWith({
        where: { couponId: "coupon-1" },
      });
      expect(prisma.productCoupon.createMany).toHaveBeenCalledWith({
        data: [
          { couponId: "coupon-1", productId: "prod-1" },
          { couponId: "coupon-1", productId: "prod-2" },
        ],
      });
    });
  });

  describe("linkVoucherToProductsBatch (upsert)", () => {
    it("should link a voucher with multiple products via upsert", async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({ id: "coupon-1" } as any);
      vi.mocked(prisma.productCoupon.upsert).mockResolvedValue({} as any);

      await CouponFacade.linkVoucherToProductsBatch("coupon-1", ["prod-1", "prod-2"]);

      expect(prisma.productCoupon.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.productCoupon.upsert).toHaveBeenNthCalledWith(1, {
        where: {
          productId_couponId: { productId: "prod-1", couponId: "coupon-1" },
        },
        update: {},
        create: { productId: "prod-1", couponId: "coupon-1" },
      });
    });
  });

  describe("linkCouponsToProduct", () => {
    it("should replace linked coupons for a product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-1" } as any);
      vi.mocked(prisma.productCoupon.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.productCoupon.create).mockResolvedValue({} as any);

      await CouponFacade.linkCouponsToProduct("prod-1", ["coupon-1", "coupon-2"]);

      expect(prisma.productCoupon.deleteMany).toHaveBeenCalledWith({
        where: { productId: "prod-1" },
      });
      expect(prisma.productCoupon.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("unlinkProductCoupon", () => {
    it("should delete a specific product coupon link", async () => {
      vi.mocked(prisma.productCoupon.delete).mockResolvedValue({ id: "pc-1" } as any);

      const result = await CouponFacade.unlinkProductCoupon("prod-1", "coupon-1");

      expect(prisma.productCoupon.delete).toHaveBeenCalledWith({
        where: {
          productId_couponId: { productId: "prod-1", couponId: "coupon-1" },
        },
      });
      expect(result).toBeDefined();
    });
  });
});
