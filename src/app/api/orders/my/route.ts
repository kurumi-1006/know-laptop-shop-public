import { auth } from "@/features/auth/lib/auth";
import { OrderFacade, OrderAccessError } from "@/features/order/lib/order-facade";
import { FeedbackRepository } from "@/features/feedback/lib/feedback";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await OrderFacade.getMyOrders(session.user, 1, 100);
    let orders = result.data;


    if (status && status !== "all") {
      orders = orders.filter((o) => o.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter((o) => o.orderCode.toLowerCase().includes(q));
    }


    const userFeedbacks = await FeedbackRepository.getUserFeedbacks(session.user.id);
    const reviewedProductIds = new Set(userFeedbacks.map((f) => f.productId));

    const mapped = orders.map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      orderDetails: (order.orderDetails ?? []).map((d) => ({
        quantity: d.quantity,
        productId: d.productId ?? null,
        productName: d.productName,
        reviewed: d.productId ? reviewedProductIds.has(d.productId) : true,
      })),
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    if (error instanceof OrderAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("My orders API failed", error);
    return NextResponse.json({ error: "Unable to fetch orders." }, { status: 500 });
  }
}
