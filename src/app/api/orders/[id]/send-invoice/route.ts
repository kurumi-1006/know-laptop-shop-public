import { auth } from "@/features/auth/lib/auth";
import { OrderRepository } from "@/features/order/lib/order-repository";
import { sendEmail, generateInvoiceHtml } from "@/lib/email-service";
import { isStaff } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await OrderRepository.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Đơn hàng không tồn tại." }, { status: 404 });
    }


    const isOwner = order.userId === session.user.id;
    const canSend = isOwner || isStaff(session.user.role);
    if (!canSend) {
      return NextResponse.json({ error: "Bạn không có quyền gửi hóa đơn này." }, { status: 403 });
    }

    const userEmail = order.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Không tìm thấy email người nhận." }, { status: 400 });
    }

    const invoiceData = {
      orderCode: order.orderCode,
      createdAt: order.createdAt,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      street: order.street ?? null,
      provinceName: order.provinceName,
      districtName: order.districtName,
      wardName: order.wardName,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountTotal: Number(order.discountTotal),
      total: Number(order.total),
      paymentMethod: order.paymentMethod ?? "cod",
      note: order.note ?? null,
      items: order.orderDetails.map((d) => ({
        productName: d.productName,
        productBrand: d.productBrand ?? null,
        quantity: d.quantity,
        unitPrice: Number(d.unitPrice),
        totalPrice: Number(d.totalPrice),
      })),
    };

    const html = generateInvoiceHtml(invoiceData);

    await sendEmail({
      to: userEmail,
      subject: `Hóa đơn ${order.orderCode} - Know`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send invoice failed", error);
    const message = error instanceof Error ? error.message : "Không thể gửi hóa đơn.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
