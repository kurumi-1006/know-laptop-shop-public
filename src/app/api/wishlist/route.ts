import { auth } from "@/features/auth/lib/auth";
import { WishlistFacade } from "@/features/wishlist/lib/wishlist-facade";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const facade = new WishlistFacade();

    facade.assertCustomer(session?.user);
    const wishlist = await facade.getWishlist(session!.user);

    return NextResponse.json(wishlist, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
