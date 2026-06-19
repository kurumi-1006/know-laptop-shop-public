import prisma from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

type SessionUser = {
  id: string;
  role?: string | null;
  [key: string]: unknown;
};

export class WishlistAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const wishlistProductSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  salePrice: true,
  stock: true,
  status: true,
  isDeleted: true,
  brand: { select: { name: true } },
  category: { select: { name: true } },
  images: {
    where: { isPrimary: true },
    orderBy: { displayOrder: "asc" as const },
    take: 1,
    select: { imageUrl: true },
  },
} as const;

export class WishlistFacade {
  assertCustomer(user: SessionUser | null | undefined) {
    if (!user) throw new WishlistAccessError("Unauthorized", 401);
    if (isStaff(user.role)) {
      throw new WishlistAccessError("Customer access only.", 403);
    }
  }


  async getWishlist(user: SessionUser) {
    this.assertCustomer(user);

    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: wishlistProductSelect,
        },
      },
    });


    return items
      .filter((item) => item.product && !item.product.isDeleted && item.product.status === "active")
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: item.product,
      }));
  }


  async getWishlistIds(user: SessionUser): Promise<string[]> {
    this.assertCustomer(user);

    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });

    return items.map((item) => item.productId);
  }


  async toggleWishlist(
    user: SessionUser,
    productId: string,
  ): Promise<{ added: boolean }> {
    this.assertCustomer(user);

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { added: false };
    }


    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false, status: "active" },
      select: { id: true },
    });

    if (!product) {
      throw new WishlistAccessError("Product not found or unavailable.", 404);
    }

    await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
    });

    return { added: true };
  }


  async removeFromWishlist(user: SessionUser, productId: string) {
    this.assertCustomer(user);

    await prisma.wishlist.deleteMany({
      where: {
        userId: user.id,
        productId,
      },
    });
  }
}
