import { auth } from "@/features/auth/lib/auth";
import { OrderFacade, OrderAccessError } from "@/features/order/lib/order-facade";
import { FeedbackRepository } from "@/features/feedback/lib/feedback";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await OrderFacade.getMyOrderDetail(session.user, id);
    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }


    const userFeedbacks = await FeedbackRepository.getUserFeedbacks(session.user.id);
    const feedbackMap = new Map(
      userFeedbacks.map((f) => [f.productId, { rating: f.rating, content: f.content }])
    );


    const completedOrders = await prisma.orders.findMany({
      where: {
        userId: session.user.id,
        status: "completed",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderDetails: {
          select: {
            productId: true,
          },
        },
      },
    });

    const latestOrderForProduct = new Map<string, string>();
    for (const completedOrder of completedOrders) {
      for (const detail of completedOrder.orderDetails) {
        if (detail.productId && !latestOrderForProduct.has(detail.productId)) {
          latestOrderForProduct.set(detail.productId, completedOrder.id);
        }
      }
    }

    const mappedOrder = {
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountTotal: Number(order.discountTotal),
      createdAt: order.createdAt.toISOString(),
      orderDetails: (order.orderDetails ?? []).map((d) => {
        const feedback = d.productId ? feedbackMap.get(d.productId) : null;
        return {
          ...d,
          unitPrice: Number(d.unitPrice),
          totalPrice: Number(d.totalPrice),
          reviewed: !!feedback,
          feedback: feedback ?? null,
          isLatestCompletedOrder: d.productId ? latestOrderForProduct.get(d.productId) === order.id : false,
        };
      }),
    };

    return NextResponse.json({ data: mappedOrder });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.action === "cancel") {
      const order = await OrderFacade.cancelMyOrder(session.user, id);
      return NextResponse.json({ data: order });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof OrderAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Order detail request failed", error);
  return NextResponse.json(
    { error: "Không thể xử lý yêu cầu." },
    { status: 500 },
  );
}
