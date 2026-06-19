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
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeftIcon, CheckCircleIcon, Loader2Icon, MailIcon, PrinterIcon, StarIcon, XCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { formatCurrency } from "@/lib/format-currency";
import { OrderInvoicePrint } from "@/features/order/components/order-invoice-print";
import { Textarea } from "@/components/ui/textarea";
import { submitProductReview } from "@/features/product/actions/feedback-actions";

type OrderDetailData = {
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
    reviewed?: boolean;
    feedback?: { rating: number; content: string | null } | null;
    isLatestCompletedOrder?: boolean;
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

function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
}

function ReviewDialog({
  open,
  onOpenChange,
  productId,
  productName,
  initialRating = 5,
  initialContent = "",
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  initialRating?: number;
  initialContent?: string;
  onSuccess: (rating: number, content: string) => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setContent(initialContent);
    }
  }, [open, initialRating, initialContent]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await submitProductReview(productId, rating, content);
    if (res.success) {
      toast.success("Cảm ơn bạn đã đánh giá!");
      onSuccess(rating, content);
      onOpenChange(false);
    } else {
      toast.error(res.error ?? "Không thể gửi đánh giá.");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh giá sản phẩm</DialogTitle>
          <DialogDescription className="line-clamp-1">{productName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = hoveredStar !== null ? star <= hoveredStar : star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="text-yellow-400 transition-transform hover:scale-110"
                >
                  <StarIcon className={`size-8 ${filled ? "fill-current" : "text-muted-foreground/30"}`} />
                </button>
              );
            })}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrderDetail({
  order: initialOrder,
  onCancel,
}: {
  order: OrderDetailData;
  onCancel: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<{ id: string; name: string; initialRating?: number; initialContent?: string } | null>(null);

  const handleReviewSuccess = (productId: string, rating: number, content: string) => {
    setReviewProduct(null);
    setOrder((prev) => ({
      ...prev,
      orderDetails: (prev.orderDetails ?? []).map((item) =>
        item.productId === productId
          ? { ...item, reviewed: true, feedback: { rating, content: content || null } }
          : item
      ),
    }));
  };

  const s = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
  const ps = paymentStatusConfig[order.paymentStatus] ?? { label: order.paymentStatus, variant: "outline" as const };
  const ONLINE_PAYMENT_METHODS = ["stripe"];
  const RETRY_BLOCKED_STATUSES = ["cancelled", "completed"];

  const canCancel = order.status === "pending" || order.status === "confirmed";
  const canRetryPayment =
    ONLINE_PAYMENT_METHODS.includes(order.paymentMethod) &&
    (order.paymentStatus === "unpaid" || order.paymentStatus === "failed") &&
    !RETRY_BLOCKED_STATUSES.includes(order.status);

  const [retryingPayment, setRetryingPayment] = useState(false);

  async function handleRetryPayment() {
    setRetryingPayment(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/retry-payment`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error ?? "Không thể tạo lại thanh toán.");
        setRetryingPayment(false);
      }
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
      setRetryingPayment(false);
    }
  }

  const refetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.data);
        toast.info("Trạng thái đơn hàng đã được cập nhật");
      }
    } catch {

    }
  }, [order.id]);

  useSupabaseRealtime({
    channelName: `order-${order.id}`,
    table: "orders",
    event: "UPDATE",
    filter: `id=eq.${order.id}`,
    callback: refetchOrder,
  });

  async function handleCancel() {
    setCancelling(true);
    setCancelError("");
    try {
      const result = await onCancel(order.id);
      if (result.ok) {
        setOrder((prev) => ({ ...prev, status: "cancelled" }));
        setDialogOpen(false);
      } else {
        setCancelError(result.error ?? "Không thể hủy đơn hàng. Vui lòng thử lại.");
      }
    } catch {
      setCancelError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      {               }
      <Button variant="ghost" size="sm" asChild className="print:hidden">
        <Link href="/profile/orders">
          <ArrowLeftIcon className="size-4" />
          Quay lại danh sách đơn hàng
        </Link>
      </Button>

      {                  }
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{order.orderCode}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Đặt ngày {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={s.variant} className={s.variant === "outline" ? "bg-muted text-muted-foreground border-transparent" : ""}>{s.label}</Badge>
              <Badge variant={ps.variant} className={ps.variant === "outline" ? "bg-muted text-muted-foreground border-transparent" : ""}>{ps.label}</Badge>
              {ONLINE_PAYMENT_METHODS.includes(order.paymentMethod) &&
                order.paymentStatus === "unpaid" && (
                  <p className="w-full text-xs text-amber-600 mt-1">
                    Đơn hàng cần được thanh toán để xác nhận. Vui lòng bấm &quot;Thanh toán lại&quot; nếu bạn chưa hoàn tất thanh toán.
                  </p>
                )}
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
              {canRetryPayment && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRetryPayment}
                  disabled={retryingPayment}
                  className="print:hidden"
                >
                  {retryingPayment ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Thanh toán lại"
                  )}
                </Button>
              )}
              {canCancel && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20">
                      <XCircleIcon className="size-4" />
                      Hủy đơn
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
                      <DialogDescription>
                        Bạn có chắc chắn muốn hủy đơn hàng{" "}
                        <span className="font-medium">{order.orderCode}</span>?
                        Hành động này không thể hoàn tác.
                      </DialogDescription>
                    </DialogHeader>
                    {cancelError && (
                      <p className="text-sm text-destructive">{cancelError}</p>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={cancelling}>
                        Giữ lại
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                        {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {                 }
          <div>
            <h3 className="font-semibold text-sm mb-3">Sản phẩm</h3>
            <div className="space-y-3">
              {order.orderDetails.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                      {order.status === "completed" && item.productId && (
                        <div className="mt-1.5">
                          {item.reviewed ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium shrink-0">
                                <CheckCircleIcon className="size-3 text-emerald-600" />
                                Đã đánh giá
                              </span>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary shrink-0 hover:text-primary/80"
                                onClick={() => {
                                  setReviewProduct({
                                    id: item.productId!,
                                    name: item.productName,
                                    initialRating: item.feedback?.rating ?? 5,
                                    initialContent: item.feedback?.content ?? "",
                                  });
                                }}
                              >
                                Chỉnh sửa đánh giá
                              </Button>
                            </div>
                          ) : item.isLatestCompletedOrder ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => {
                                setReviewProduct({ id: item.productId!, name: item.productName });
                              }}
                            >
                              <StarIcon className="size-3 mr-1 text-yellow-500 fill-yellow-500" />
                              Đánh giá
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium shrink-0">
                              Đã mua
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {formatCurrency(Number(item.totalPrice))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {                  }
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

      {reviewProduct && (
        <ReviewDialog
          open={!!reviewProduct}
          onOpenChange={(open) => {
            if (!open) setReviewProduct(null);
          }}
          productId={reviewProduct.id}
          productName={reviewProduct.name}
          initialRating={reviewProduct.initialRating}
          initialContent={reviewProduct.initialContent}
          onSuccess={(rating, content) => handleReviewSuccess(reviewProduct.id, rating, content)}
        />
      )}
    </div>
  );
}
