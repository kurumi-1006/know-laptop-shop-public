"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  PackageIcon,
  SearchIcon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
    reviewed?: boolean;
  }[];
};

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ XN" },
  { key: "confirmed", label: "Đã XN" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
] as const;

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


function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-5 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OrderListClient() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("status", activeFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/orders/my?${params.toString()}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setError("Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);



  const filterBar = (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="relative flex-1 max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm mã đơn hàng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );

  if (loading && orders.length === 0) {
    return (
      <div>
        {filterBar}
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {filterBar}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchOrders}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        {filterBar}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBagIcon className="size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">
            {activeFilter !== "all" || searchQuery ? "Không tìm thấy đơn hàng" : "Chưa có đơn hàng nào"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeFilter !== "all" || searchQuery
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
              : "Bạn chưa đặt đơn hàng nào. Hãy khám phá sản phẩm và bắt đầu mua sắm."}
          </p>
          {activeFilter === "all" && !searchQuery && (
            <Button asChild className="mt-6">
              <Link href="/products">Khám phá sản phẩm</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {filterBar}

      <div className="space-y-3">
        {orders.map((order) => {
          const s = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
          const ps = paymentStatusConfig[order.paymentStatus] ?? { label: order.paymentStatus, variant: "outline" as const };
          const itemCount = order.orderDetails?.reduce((sum, d) => sum + d.quantity, 0) ?? 0;
          const isCompleted = order.status === "completed";
          const productsWithId = isCompleted
            ? (order.orderDetails ?? []).filter((d) => d.productId)
            : [];
          const reviewedCount = isCompleted
            ? (order.orderDetails ?? []).filter((d) => d.productId && d.reviewed).length
            : 0;

          return (
            <Card key={order.id} className="shadow-none transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
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
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {formatCurrency(Number(order.total))}
                    </p>
                    <div className="flex items-center gap-1">
                      {isCompleted && reviewedCount > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircleIcon className="size-3 text-emerald-500" />
                          Đã đánh giá {reviewedCount}/{productsWithId.length} SP
                        </p>
                      )}
                      <Link
                        href={`/profile/orders/${order.id}`}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
