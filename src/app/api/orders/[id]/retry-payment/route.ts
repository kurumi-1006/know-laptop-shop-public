import { auth } from "@/features/auth/lib/auth";
import { StripeService } from "@/features/payment/lib/stripe-service";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";




const RETRY_BLOCKED_STATUSES = ["cancelled", "completed"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để tiếp tục." }, { status: 401 });
    }

    const { id } = await params;
    const orderId = id;

    if (!orderId) {
      return NextResponse.json({ error: "Mã đơn hàng không hợp lệ." }, { status: 400 });
    }


    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        orderCode: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Đơn hàng không tồn tại." }, { status: 404 });
    }


    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Bạn không có quyền thực hiện hành động này." }, { status: 403 });
    }


    if (RETRY_BLOCKED_STATUSES.includes(order.status as any)) {
      return NextResponse.json(
        { error: `Không thể thanh toán lại đơn hàng đã ${order.status === "cancelled" ? "bị hủy" : "hoàn thành"}.` },
        { status: 400 },
      );
    }


    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Đơn hàng đã được thanh toán." }, { status: 400 });
    }


    if (order.paymentMethod !== "stripe") {
      return NextResponse.json(
        { error: "Phương thức thanh toán này không hỗ trợ thanh toán lại online." },
        { status: 400 },
      );
    }


    const amount = Number(order.total);
    if (amount <= 0) {
      return NextResponse.json({ error: "Tổng đơn hàng không hợp lệ." }, { status: 400 });
    }


    if (!StripeService.isConfigured()) {
      return NextResponse.json({ error: "Stripe chưa được cấu hình." }, { status: 500 });
    }

    const result = await StripeService.createCheckoutSession({
      orderCode: order.orderCode,
      amount,
    });


    await prisma.orders.update({
      where: { id: order.id },
      data: { paymentSessionId: result.sessionId },
    });

    return NextResponse.json({ checkoutUrl: result.payUrl });
  } catch (error) {
    console.error("Retry payment failed", error);
    return NextResponse.json(
      { error: "Không thể tạo lại thanh toán. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
