"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrderStatus } from "@/app/generated/prisma/enums";
import { getAllowedTransitions } from "@/features/order/lib/order-state-machine";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeftIcon, MailIcon, PrinterIcon, XCircleIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format-currency";
import { OrderInvoicePrint } from "@/features/order/components/order-invoice-print";

type AdminOrderData = {
  id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  receiverName: string;
  receiverPhone: string;
  street?: string | null;
  provinceName: string;
  districtName: string;
  wardName: string;
  note?: string | null;
  createdAt: string;
  user: { name?: string | null; email: string };
  coupon?: { code: string } | null;
  orderDetails: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    productImage?: string | null;
    productBrand?: string | null;
    productId?: string | null;
  }>;
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

const paymentMethodLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  stripe: "Stripe",
};

export function AdminOrderDetail({ order: initialOrder }: { order: AdminOrderData }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);

  const s = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
  const ps = paymentStatusConfig[order.paymentStatus] ?? { label: order.paymentStatus, variant: "outline" as const };
  const allowedTransitions = getAllowedTransitions(order.status as OrderStatus);

  async function handleUpdateStatus() {
    if (!nextStatus) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.data);
        setDialogOpen(false);
        setNextStatus(null);
        toast.success(`Đơn hàng đã chuyển sang "${statusConfig[nextStatus]?.label ?? nextStatus}".`);
        router.refresh();
      } else {
        const msg = data.error ?? "Không thể cập nhật trạng thái.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeftIcon className="size-4" />
        Quay lại
      </Button>

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{order.orderCode}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Đặt ngày {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </p>
              <p className="text-sm text-muted-foreground">
                Khách hàng: {order.user?.name ?? order.user?.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={s.variant} className={s.variant === "outline" ? "bg-muted text-muted-foreground border-transparent" : ""}>{s.label}</Badge>
              <Badge variant={ps.variant} className={ps.variant === "outline" ? "bg-muted text-muted-foreground border-transparent" : ""}>{ps.label}</Badge>
              {order.paymentMethod === "stripe" && order.paymentStatus !== "paid" && order.status !== "cancelled" && (
                <p className="w-full text-xs text-amber-600">
                  Đơn hàng thanh toán qua Stripe chưa được thanh toán. Không thể hoàn thành cho đến khi khách thanh toán.
                </p>
              )}
              {allowedTransitions.length > 0 && (
                <div className="flex gap-1">
                  {allowedTransitions.map((transition) => {
                    const tConfig = statusConfig[transition] ?? { label: transition };
                    return (
                      <Dialog
                        key={transition}
                        open={dialogOpen && nextStatus === transition}
                        onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setNextStatus(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNextStatus(transition)}
                            className={transition === "cancelled" ? "text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" : ""}
                          >
                            {transition === "cancelled" && <XCircleIcon className="size-4" />}
                            Chuyển sang {tConfig.label.toLowerCase()}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
                            <DialogDescription>
                              Chuyển đơn hàng{" "}
                              <span className="font-medium">{order.orderCode}</span>{" "}
                              từ <span className="font-medium">{s.label}</span> sang{" "}
                              <span className="font-medium">{tConfig.label}</span>?
                            </DialogDescription>
                          </DialogHeader>
                          {error && <p className="text-sm text-destructive">{error}</p>}
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => { setDialogOpen(false); setNextStatus(null); }}
                              disabled={updating}
                            >
                              Hủy
                            </Button>
                            <Button
                              variant={transition === "cancelled" ? "destructive" : "default"}
                              onClick={handleUpdateStatus}
                              disabled={updating}
                            >
                              {updating ? "Đang xử lý..." : "Xác nhận"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-1">
                <OrderInvoicePrint
                  order={{
                    id: order.id,
                    orderCode: order.orderCode,
                    createdAt: order.createdAt,
                    receiverName: order.receiverName,
                    receiverPhone: order.receiverPhone,
                    street: order.street ?? null,
                    provinceName: order.provinceName,
                    districtName: order.districtName,
                    wardName: order.wardName,
                    subtotal: order.subtotal,
                    shippingFee: order.shippingFee,
                    discountTotal: order.discountTotal,
                    total: order.total,
                    paymentMethod: order.paymentMethod,
                    note: order.note ?? null,
                    items: (order.orderDetails ?? []).map((d) => ({
                      productName: d.productName,
                      productBrand: d.productBrand ?? null,
                      quantity: d.quantity,
                      unitPrice: d.unitPrice,
                      totalPrice: d.totalPrice,
                    })),
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/orders/${order.id}/send-invoice`, { method: "POST" });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success("Đã gửi hóa đơn qua email.");
                      } else {
                        toast.error(data.error || "Không thể gửi hóa đơn.");
                      }
                    } catch {
                      toast.error("Không thể gửi hóa đơn.");
                    }
                  }}
                  className="print:hidden"
                >
                  <MailIcon className="size-4" />
                  Gửi email
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {                 }
          <div>
            <h3 className="font-semibold text-sm mb-3">Sản phẩm</h3>
            <div className="space-y-3">
              {(order.orderDetails ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No img</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    {item.productBrand && (
                      <p className="text-xs text-muted-foreground">{item.productBrand}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      SL: {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {formatCurrency(Number(item.totalPrice))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {               }
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-sm mb-2">Địa chỉ nhận hàng</h3>
              <p className="text-sm">{order.receiverName} · {order.receiverPhone}</p>
              <p className="text-sm text-muted-foreground">
                {[order.street, order.wardName, order.districtName, order.provinceName]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.note && (
                <p className="text-sm text-muted-foreground mt-1">
                  Ghi chú: {order.note}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Thanh toán</h3>
              <p className="text-sm">{paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}</p>
              {order.coupon && (
                <p className="text-sm text-muted-foreground">
                  Mã giảm giá: {order.coupon.code}
                </p>
              )}
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>{formatCurrency(Number(order.shippingFee))}</span>
                </div>
                {Number(order.discountTotal) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(Number(order.discountTotal))}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
