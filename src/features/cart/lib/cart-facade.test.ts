import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { CartFacade, CartAccessError } from "./cart-facade";

describe("CartFacade", () => {
  let facade: CartFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    facade = new CartFacade();
  });

  describe("assertCustomer", () => {
    it("should allow customers", () => {
      expect(() =>
        facade.assertCustomer({ id: "user-1", role: "customer" })
      ).not.toThrow();
    });

    it("should allow users with null or undefined roles as customers", () => {
      expect(() =>
        facade.assertCustomer({ id: "user-1", role: null })
      ).not.toThrow();
    });

    it("should throw 401 if user is not logged in", () => {
      expect(() => facade.assertCustomer(null)).toThrowError(
        new CartAccessError("Unauthorized", 401)
      );
    });

    it("should throw 403 if user is admin or staff", () => {
      expect(() =>
        facade.assertCustomer({ id: "user-1", role: "admin" })
      ).toThrowError(new CartAccessError("Customer access only.", 403));
    });
  });

  describe("addToCart", () => {
    it("throws error if product is out of stock or inactive", async () => {
      (prisma.product.findFirst as any).mockResolvedValue(null);

      await expect(
        facade.addToCart({ id: "user-1" }, "product-1", 1)
      ).rejects.toThrowError(
        new CartAccessError("Product not found or unavailable.", 404)
      );
    });

    it("throws error if new quantity exceeds product stock", async () => {
      (prisma.product.findFirst as any).mockResolvedValue({
        id: "product-1",
        stock: 5,
      });
      (prisma.cart.findUnique as any).mockResolvedValue({ id: "cart-1" });
      (prisma.cartItem.findUnique as any).mockResolvedValue({
        id: "item-1",
        quantity: 3,
      });

      await expect(
        facade.addToCart({ id: "user-1" }, "product-1", 3)
      ).rejects.toThrowError(
        new CartAccessError(
          "Chỉ còn lại 5 sản phẩm trong kho. Bạn không thể thêm quá số lượng này.",
          400
        )
      );
    });

    it("updates quantity if product already in cart", async () => {
      (prisma.product.findFirst as any).mockResolvedValue({
        id: "product-1",
        stock: 10,
      });
      (prisma.cart.findUnique as any).mockResolvedValue({ id: "cart-1" });
      (prisma.cartItem.findUnique as any).mockResolvedValue({
        id: "item-1",
        quantity: 3,
      });

      const result = await facade.addToCart({ id: "user-1" }, "product-1", 2);

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { quantity: 5 },
      });
      expect(result).toEqual({ added: true });
    });

    it("creates a new cart item if product not in cart", async () => {
      (prisma.product.findFirst as any).mockResolvedValue({
        id: "product-1",
        stock: 10,
      });
      (prisma.cart.findUnique as any).mockResolvedValue({ id: "cart-1" });
      (prisma.cartItem.findUnique as any).mockResolvedValue(null);

      const result = await facade.addToCart({ id: "user-1" }, "product-1", 2);

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: "cart-1",
          productId: "product-1",
          quantity: 2,
        },
      });
      expect(result).toEqual({ added: true });
    });
  });

  describe("updateCartItemQuantity", () => {
    it("removes item if quantity is zero or less", async () => {
      (prisma.cart.findUnique as any).mockResolvedValue({ id: "cart-1" });

      const result = await facade.updateCartItemQuantity(
        { id: "user-1" },
        "product-1",
        0
      );

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: "cart-1",
          productId: "product-1",
        },
      });
      expect(result).toEqual({ removed: true });
    });
  });
});
