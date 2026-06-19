import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { BadgeCheckIcon, XCircleIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kết quả thanh toán | Know",
  description: "Kết quả thanh toán",
};

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    resultCode?: string;
    message?: string;
    success?: string;
    canceled?: string;
  }>;
}) {
  const params = await searchParams;
  const resultCode = params.resultCode;
  const orderCode = params.orderId;
  const message = params.message;
  const isStripeSuccess = params.success === "true";
  const isStripeCanceled = params.canceled === "true";


  let order: { id: string; orderCode: string; status: string; paymentStatus: string } | null = null;
  if (orderCode) {
    try {
      order = await prisma.orders.findFirst({
        where: { orderCode },
        select: { id: true, orderCode: true, status: true, paymentStatus: true },
      });
    } catch {

    }
  }


  let icon: React.ReactNode;
  let title: string;
  let description: string;
  let showOrderLink = false;

  if (isStripeCanceled) {

    icon = <XCircleIcon className="size-12 text-amber-500 mx-auto" />;
    title = "Thanh toán bị hủy";
    description = "Bạn đã hủy thanh toán. Đơn hàng vẫn được lưu, bạn có thể thanh toán lại sau.";
    showOrderLink = !!order;
  } else if (isStripeSuccess && order) {
    if (order.paymentStatus === "paid") {

      icon = <BadgeCheckIcon className="size-12 text-emerald-500 mx-auto" />;
      title = "Thanh toán thành công";
      description = `Đơn hàng ${order.orderCode} đã được thanh toán và xác nhận.`;
      showOrderLink = true;
    } else {

      icon = <ClockIcon className="size-12 text-blue-500 mx-auto" />;
      title = "Đang xử lý thanh toán";
      description =
        "Thanh toán của bạn đang được xử lý. Trạng thái đơn hàng sẽ tự động cập nhật trong giây lát.";
      showOrderLink = true;
    }
  } else if (isStripeSuccess && !order) {

    icon = <AlertTriangleIcon className="size-12 text-amber-500 mx-auto" />;
    title = "Đang xử lý";
    description = "Đơn hàng đang được tạo. Vui lòng kiểm tra danh sách đơn hàng.";
    showOrderLink = false;
  } else if (resultCode) {

    const isSuccess = resultCode === "0";
    icon = isSuccess ? (
      <BadgeCheckIcon className="size-12 text-emerald-500 mx-auto" />
    ) : (
      <XCircleIcon className="size-12 text-destructive mx-auto" />
    );
    title = isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại";
    description = message
      ? decodeURIComponent(message)
      : isSuccess
        ? "Cảm ơn bạn đã mua hàng!"
        : "Đã có lỗi xảy ra trong quá trình thanh toán.";
    showOrderLink = !!order;
  } else {

    icon = <AlertTriangleIcon className="size-12 text-muted-foreground mx-auto" />;
    title = "Không xác định";
    description = "Không tìm thấy thông tin thanh toán.";
    showOrderLink = false;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-16">
      <Card className="w-full shadow-none text-center">
        <CardHeader>
          {icon}
          <CardTitle className="text-lg mt-2">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          {order && (
            <p className="text-sm text-muted-foreground">
              Mã đơn hàng: <span className="font-medium">{order.orderCode}</span>
            </p>
          )}

          {showOrderLink && order ? (
            <Button asChild className="w-full">
              <Link href={`/profile/orders/${order.id}`}>Xem chi tiết đơn hàng</Link>
            </Button>
          ) : null}

          <Button variant="outline" asChild className="w-full">
            <Link href="/profile/orders">Quay lại danh sách đơn hàng</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
