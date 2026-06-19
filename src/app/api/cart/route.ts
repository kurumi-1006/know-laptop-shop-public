import { auth } from "@/features/auth/lib/auth";
import { CartFacade } from "@/features/cart/lib/cart-facade";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const facade = new CartFacade();

    facade.assertCustomer(session?.user);
    const cartItems = await facade.getCart(session!.user);

    return NextResponse.json(cartItems, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
