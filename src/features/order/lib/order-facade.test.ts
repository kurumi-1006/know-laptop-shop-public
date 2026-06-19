import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const localMockTx = {
    profile: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    address: { findFirst: vi.fn() },
    coupon: { findUnique: vi.fn(), updateMany: vi.fn(() => ({ count: 1 })) },
    cart: { findUnique: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
    orders: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    product: { updateMany: vi.fn() },
  };
  return {
    default: {
      ...localMockTx,
      $transaction: vi.fn((callback) => callback(localMockTx)),
    },
  };
});

vi.mock("@/features/cart/lib/cart-facade", () => {
  const mockGetCart = vi.fn();
  return {
    CartFacade: class {
      getCart = mockGetCart;
    },
    mockGetCart,
  };
});

vi.mock("@/features/coupon/lib/coupon", () => {
  return {
    CouponFacade: {
      validate: vi.fn(),
    },
  };
});

vi.mock("@/features/payment/lib/stripe-service", () => {
  return {
    StripeService: {
      isConfigured: vi.fn(),
      createCheckoutSession: vi.fn(),
    },
  };
});

import prisma from "@/lib/prisma";
import * as cartFacadeModule from "@/features/cart/lib/cart-facade";
import { CouponFacade } from "@/features/coupon/lib/coupon";

const mockGetCart = (cartFacadeModule as any).mockGetCart;
import { OrderFacade, OrderAccessError } from "./order-facade";

describe("OrderFacade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkout", () => {
    it("should throw error if cart is empty", async () => {
      (mockGetCart as any).mockResolvedValue([]);

      await expect(
        OrderFacade.checkout({ id: "user-1", role: "customer" }, {})
      ).rejects.toThrowError(
        new OrderAccessError("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.", 400)
      );
    });

    it("should throw error if address is missing", async () => {
      (mockGetCart as any).mockResolvedValue([
        {
          productId: "p-1",
          quantity: 1,
          product: { name: "Product 1", price: 100000, salePrice: null },
        },
      ]);
      (prisma.profile.findUnique as any).mockResolvedValue({ phone: "0900000000" });
      (prisma.user.findUnique as any).mockResolvedValue({ name: "John Doe" });
      (prisma.address.findFirst as any).mockResolvedValue(null);

      await expect(
        OrderFacade.checkout({ id: "user-1", role: "customer" }, {})
      ).rejects.toThrowError(
        new OrderAccessError("Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong phần Cài đặt tài khoản.", 400)
      );
    });

    it("creates COD order successfully when stock is available", async () => {
      (mockGetCart as any).mockResolvedValue([
        {
          productId: "p-1",
          quantity: 2,
          product: { name: "Product 1", price: 100000, salePrice: null },
        },
      ]);
      (prisma.profile.findUnique as any).mockResolvedValue({ phone: "0900000000" });
      (prisma.user.findUnique as any).mockResolvedValue({ name: "John Doe" });
      (prisma.address.findFirst as any).mockResolvedValue({
        id: "addr-1",
        receiverName: "John Doe",
        receiverPhone: "0900000000",
        street: "123 Main St",
        provinceName: "Hanoi",
        districtName: "Ba Dinh",
        wardName: "Kim Ma",
      });

      (prisma.product.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.orders.create as any).mockResolvedValue({ id: "order-1", orderCode: "ORD-TEST-123", total: 230000 });
      (prisma.cart.findUnique as any).mockResolvedValue({ id: "cart-1" });
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await OrderFacade.checkout(
        { id: "user-1", role: "customer" },
        { paymentMethod: "cod" }
      );

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: "p-1",
          isDeleted: false,
          status: "active",
          stock: { gte: 2 },
        },
        data: {
          stock: { decrement: 2 },
        },
      });

      expect(prisma.orders.create).toHaveBeenCalled();
      expect(result.id).toBe("order-1");
    });
  });

  describe("cancelMyOrder", () => {
    it("throws 404 if order does not exist", async () => {
      (prisma.orders.findUnique as any).mockResolvedValue(null);

      await expect(
        OrderFacade.cancelMyOrder({ id: "user-1", role: "customer" }, "order-invalid")
      ).rejects.toThrowError(new OrderAccessError("Đơn hàng không tồn tại.", 404));
    });

    it("throws 403 if customer does not own the order", async () => {
      (prisma.orders.findUnique as any).mockResolvedValue({
        id: "order-1",
        userId: "user-other",
      });

      await expect(
        OrderFacade.cancelMyOrder({ id: "user-1", role: "customer" }, "order-1")
      ).rejects.toThrowError(new OrderAccessError("Bạn không có quyền hủy đơn hàng này.", 403));
    });
  });
});
