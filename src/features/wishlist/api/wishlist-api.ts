import { apiClient } from "@/lib/axios";
import {
  toggleWishlistAction,
  removeFromWishlistAction,
} from "@/features/wishlist/actions/wishlist-actions";

export interface WishlistProduct {
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

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

export async function getWishlistProducts(): Promise<WishlistItem[]> {
  const { data } = await apiClient.get("/api/wishlist", {
    headers: { "Cache-Control": "no-store" },
  });
  return data;
}

export async function getWishlistIds(): Promise<string[]> {
  const { data } = await apiClient.get("/api/wishlist/ids", {
    headers: { "Cache-Control": "no-store" },
  });
  return data;
}

export async function toggleWishlist(
  productId: string,
): Promise<{ added: boolean }> {
  const result = await toggleWishlistAction(productId);
  if (!result.ok) throw new Error(result.error);
  return { added: result.added };
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const result = await removeFromWishlistAction(productId);
  if (!result.ok) throw new Error(result.error);
}
