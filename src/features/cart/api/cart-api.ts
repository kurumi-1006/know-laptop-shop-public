import { apiClient } from "@/lib/axios";
import {
  addToCartAction,
  updateCartItemQuantityAction,
  removeFromCartAction,
  clearCartAction,
} from "@/features/cart/actions/cart-actions";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  status: string;
  brand: { name: string };
  category: { name: string };
  images: Array<{ imageUrl: string }>;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  createdAt: string;
  product: CartProduct;
}

export async function getCartProducts(): Promise<CartItem[]> {
  const { data } = await apiClient.get("/api/cart", {
    headers: { "Cache-Control": "no-store" },
  });
  return data;
}

export async function addToCart(
  productId: string,
  quantity: number,
): Promise<{ added: boolean }> {
  const result = await addToCartAction(productId, quantity);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<{ updated?: boolean; removed?: boolean }> {
  const result = await updateCartItemQuantityAction(productId, quantity);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export async function removeFromCart(productId: string): Promise<void> {
  const result = await removeFromCartAction(productId);
  if (!result.ok) throw new Error(result.error);
}

export async function clearCart(): Promise<void> {
  const result = await clearCartAction();
  if (!result.ok) throw new Error(result.error);
}
