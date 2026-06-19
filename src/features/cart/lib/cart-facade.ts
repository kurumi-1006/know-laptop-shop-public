import prisma from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

type SessionUser = {
  id: string;
  role?: string | null;
  [key: string]: unknown;
};

export class CartAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const cartProductSelect = {
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

export class CartFacade {
  assertCustomer(user: SessionUser | null | undefined) {
    if (!user) throw new CartAccessError("Unauthorized", 401);
    if (isStaff(user.role)) {
      throw new CartAccessError("Customer access only.", 403);
    }
  }

  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }


  async getCart(user: SessionUser) {
    this.assertCustomer(user);

    const cart = await this.getOrCreateCart(user.id);

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: cartProductSelect,
        },
      },
    });


    return items
      .filter((item) => item.product && !item.product.isDeleted && item.product.status === "active")
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        product: item.product,
      }));
  }


  async addToCart(
    user: SessionUser,
    productId: string,
    quantity: number,
  ): Promise<{ added: boolean }> {
    this.assertCustomer(user);

    if (quantity <= 0) {
      throw new CartAccessError("Quantity must be greater than 0.", 400);
    }

    const cart = await this.getOrCreateCart(user.id);


    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false, status: "active" },
      select: { id: true, stock: true },
    });

    if (!product) {
      throw new CartAccessError("Product not found or unavailable.", 404);
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (newQuantity > product.stock) {
      throw new CartAccessError(
        `Chỉ còn lại ${product.stock} sản phẩm trong kho. Bạn không thể thêm quá số lượng này.`,
        400
      );
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return { added: true };
  }


  async updateCartItemQuantity(
    user: SessionUser,
    productId: string,
    quantity: number,
  ) {
    this.assertCustomer(user);

    const cart = await this.getOrCreateCart(user.id);

    if (quantity <= 0) {
      await this.removeFromCart(user, productId);
      return { removed: true };
    }


    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false, status: "active" },
      select: { id: true, stock: true },
    });

    if (!product) {
      throw new CartAccessError("Product not found or unavailable.", 404);
    }

    if (quantity > product.stock) {
      throw new CartAccessError(
        `Chỉ còn lại ${product.stock} sản phẩm trong kho.`,
        400
      );
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existing) {
      throw new CartAccessError("Item not found in cart.", 404);
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    return { updated: true };
  }


  async removeFromCart(user: SessionUser, productId: string) {
    this.assertCustomer(user);

    const cart = await this.getOrCreateCart(user.id);

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });
  }


  async clearCart(user: SessionUser) {
    this.assertCustomer(user);

    const cart = await this.getOrCreateCart(user.id);

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });
  }
}
