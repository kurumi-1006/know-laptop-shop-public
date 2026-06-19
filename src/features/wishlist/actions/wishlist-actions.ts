"use server";

import { auth } from "@/features/auth/lib/auth";
import {
  WishlistAccessError,
  WishlistFacade,
} from "@/features/wishlist/lib/wishlist-facade";
import { headers } from "next/headers";

type WishlistToggleResult =
  | { ok: true; added: boolean }
  | { ok: false; error: string };

type WishlistRemoveResult = { ok: true } | { ok: false; error: string };

export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistToggleResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new WishlistFacade();

  try {
    facade.assertCustomer(session?.user);
    const result = await facade.toggleWishlist(session!.user, productId);
    return { ok: true, added: result.added };
  } catch (error) {
    if (error instanceof WishlistAccessError) {
      return { ok: false, error: error.message };
    }
    console.error("Toggle wishlist action failed", error);
    return { ok: false, error: "Unable to update wishlist." };
  }
}

export async function removeFromWishlistAction(
  productId: string,
): Promise<WishlistRemoveResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const facade = new WishlistFacade();

  try {
    facade.assertCustomer(session?.user);
    await facade.removeFromWishlist(session!.user, productId);
    return { ok: true };
  } catch (error) {
    if (error instanceof WishlistAccessError) {
      return { ok: false, error: error.message };
    }
    console.error("Remove from wishlist action failed", error);
    return { ok: false, error: "Unable to remove from wishlist." };
  }
}
