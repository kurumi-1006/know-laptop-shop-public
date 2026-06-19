import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    wishlist: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { WishlistFacade, WishlistAccessError } from "./wishlist-facade";

describe("WishlistFacade", () => {
  let facade: WishlistFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    facade = new WishlistFacade();
  });

  describe("assertCustomer", () => {
    it("throws 401 if user is not logged in", () => {
      expect(() => facade.assertCustomer(null)).toThrowError(
        new WishlistAccessError("Unauthorized", 401)
      );
    });

    it("throws 403 if user role is staff/admin", () => {
      expect(() =>
        facade.assertCustomer({ id: "user-1", role: "staff" })
      ).toThrowError(new WishlistAccessError("Customer access only.", 403));
    });
  });

  describe("toggleWishlist", () => {
    it("deletes item from wishlist if it is already present", async () => {
      (prisma.wishlist.findUnique as any).mockResolvedValue({
        id: "w-1",
        userId: "user-1",
        productId: "product-1",
      });

      const result = await facade.toggleWishlist(
        { id: "user-1", role: "customer" },
        "product-1"
      );

      expect(prisma.wishlist.delete).toHaveBeenCalledWith({
        where: { id: "w-1" },
      });
      expect(result).toEqual({ added: false });
    });

    it("adds item to wishlist if it is not present and product is active", async () => {
      (prisma.wishlist.findUnique as any).mockResolvedValue(null);
      (prisma.product.findFirst as any).mockResolvedValue({ id: "product-1" });

      const result = await facade.toggleWishlist(
        { id: "user-1", role: "customer" },
        "product-1"
      );

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: "product-1", isDeleted: false, status: "active" },
        select: { id: true },
      });
      expect(prisma.wishlist.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          productId: "product-1",
        },
      });
      expect(result).toEqual({ added: true });
    });

    it("throws 404 if product does not exist or is inactive", async () => {
      (prisma.wishlist.findUnique as any).mockResolvedValue(null);
      (prisma.product.findFirst as any).mockResolvedValue(null);

      await expect(
        facade.toggleWishlist({ id: "user-1", role: "customer" }, "product-1")
      ).rejects.toThrowError(
        new WishlistAccessError("Product not found or unavailable.", 404)
      );
    });
  });
});
