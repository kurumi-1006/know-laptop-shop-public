"use server";

import { auth } from "@/features/auth/lib/auth";
import {
  CartAccessError,
  CartFacade,
} from "@/features/cart/lib/cart-facade";
import { headers } from "next/headers";

type CartActionResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function addToCartAction(
  productId: string,
  quantity: number,
): Promise<CartActionResult<{ added: boolean }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new CartFacade();

  try {
    facade.assertCustomer(session?.user);
    const result = await facade.addToCart(session!.user, productId, quantity);
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof CartAccessError) {
      return { ok: false, error: error.message };
    }
    console.error("Add to cart action failed", error);
    return { ok: false, error: "Không thể thêm sản phẩm vào giỏ hàng." };
  }
}

export async function updateCartItemQuantityAction(
  productId: string,
  quantity: number,
): Promise<CartActionResult<{ updated?: boolean; removed?: boolean }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new CartFacade();

  try {
    facade.assertCustomer(session?.user);
    const result = await facade.updateCartItemQuantity(session!.user, productId, quantity);
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof CartAccessError) {
      return { ok: false, error: error.message };
    }
    console.error("Update cart quantity action failed", error);
    return { ok: false, error: "Không thể cập nhật số lượng." };
  }
}

export async function removeFromCartAction(
  productId: string,
): Promise<CartActionResult<void>> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new CartFacade();

  try {
    facade.assertCustomer(session?.user);
    await facade.removeFromCart(session!.user, productId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof CartAccessError) {
      return { ok: false, error: error.message };
    }
    console.error("Remove from cart action failed", error);
    return { ok: false, error: "Không thể xóa sản phẩm khỏi giỏ hàng." };
  }
}

export async function clearCartAction(): Promise<CartActionResult<void>> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new CartFacade();

  try {
    facade.assertCustomer(session?.user);
    await facade.clearCart(session!.user);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof CartAccessError) {
      return { ok: false, error: error.message };
    }
    console.error("Clear cart action failed", error);
    return { ok: false, error: "Không thể làm trống giỏ hàng." };
  }
}
