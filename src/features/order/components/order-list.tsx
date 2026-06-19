"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRightIcon, PackageIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency";

type OrderItem = {
  id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  orderDetails?: {
    quantity: number;
    productId?: string | null;
    productName: string;
  }[];
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xác nhận", variant: "outline" },
  confirmed: { label: "Đã xác nhận", variant: "secondary" },
  shipping: { label: "Đang giao", variant: "secondary" },
  completed: { label: "Hoàn thành", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: "Chưa thanh toán", variant: "outline" },
  paid: { label: "Đã thanh toán", variant: "default" },
  failed: { label: "Thanh toán lỗi", variant: "destructive" },
};

function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
}

export function OrderList({ orders }: { orders: OrderItem[] }) {

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBagIcon className="size-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-semibold">Chưa có đơn hàng nào</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Bạn chưa đặt đơn hàng nào. Hãy khám phá sản phẩm và bắt đầu mua sắm.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Khám phá sản phẩm</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order) => {
          const s = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
          const ps = paymentStatusConfig[order.paymentStatus] ?? { label: order.paymentStatus, variant: "outline" as const };
          const itemCount = order.orderDetails?.reduce((sum, d) => sum + d.quantity, 0) ?? 0;
          const isCompleted = order.status === "completed";

          return (
            <Card key={order.id} className="shadow-none transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between p-4 gap-3">
                <Link href={`/profile/orders/${order.id}`} className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
                    <PackageIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{order.orderCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} · {itemCount} sản phẩm
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                      <Badge variant={ps.variant} className="text-xs">{ps.label}</Badge>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/profile/orders/${order.id}`} className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(Number(order.total))}</p>
                    <ArrowRightIcon className="size-4 text-muted-foreground ml-auto mt-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
