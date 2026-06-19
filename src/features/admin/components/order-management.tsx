"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderEntry } from "@/features/admin/api/orders";
import { useOrders } from "@/features/admin/hooks/use-orders";
import { SEARCH_DEBOUNCE_MS, SKELETON_ROW_COUNT } from "@/features/admin/constants";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { downloadCSV } from "@/lib/download-csv.client";
import { formatCurrency } from "@/lib/format-currency";
import { useDebounce } from "@/hooks/use-debounce";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowRightIcon,
  BanIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  DownloadIcon,
  PackageIcon,
  SearchIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xác nhận", variant: "outline" },
  confirmed: { label: "Đã xác nhận", variant: "secondary" },
  shipping: { label: "Đang giao", variant: "secondary" },
  completed: { label: "Hoàn thành", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: "Chưa TT", variant: "outline" },
  paid: { label: "Đã TT", variant: "default" },
  failed: { label: "TT lỗi", variant: "destructive" },
};

function relativeDate(value: string) {
  return format(new Date(value), "dd/MM/yy HH:mm", { locale: vi });
}

export function OrderManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1"));
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get("paymentStatus") ?? "all");

  const orders = useOrders({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    paymentStatus: paymentFilter,
  });

  const refresh = useCallback(() => {
    orders.refetch();
  }, [orders]);

  useSupabaseRealtime({
    channelName: "admin-orders",
    table: "orders",
    event: "*",
    callback: refresh,
  });

  useSupabaseRealtime({
    channelName: "admin-orders-new",
    table: "orders",
    event: "INSERT",
    callback: () => {
      toast.info("Có đơn hàng mới");
    },
  });

  const stats = orders.data?.stats;
  const pagination = orders.data?.pagination;

  const handleExportCSV = async () => {
    try {
      const url = new URL("/api/admin/reports/orders", window.location.origin);
      url.searchParams.set("format", "csv");
      url.searchParams.set("status", statusFilter);
      url.searchParams.set("paymentStatus", paymentFilter);
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      await downloadCSV(url.toString(), "danh-sach-don-hang.csv");
      toast.success("Đã xuất CSV");
    } catch {
      toast.error("Không thể xuất CSV");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Quản lý cửa hàng
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Đơn hàng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi và xử lý đơn hàng, cập nhật trạng thái giao hàng và thanh toán.
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <DownloadIcon />
          Xuất CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tổng đơn hàng",
            value: stats?.total,
            icon: ClipboardListIcon,
          },
          {
            label: "Chờ xác nhận",
            value: stats?.pending,
            icon: PackageIcon,
          },
          {
            label: "Đang giao",
            value: stats?.shipping,
            icon: TruckIcon,
          },
          {
            label: "Hoàn thành",
            value: stats?.completed,
            icon: CheckCircle2Icon,
          },
          {
            label: "Đã hủy",
            value: stats?.cancelled,
            icon: BanIcon,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {orders.isLoading && !orders.data ? (
                  <Skeleton className="mt-2 h-7 w-12" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold">{value ?? 0}</p>
                )}
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Danh sách đơn hàng</CardTitle>
              <CardDescription>
                {orders.data?.pagination.total ?? 0} đơn hàng phù hợp
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-64">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo mã đơn, tên, SĐT..."
                  value={search}
                />
              </div>
              <Select
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                value={statusFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusConfig).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => {
                  setPaymentFilter(value);
                  setPage(1);
                }}
                value={paymentFilter}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả TT</SelectItem>
                  {Object.entries(paymentStatusConfig).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.isLoading
                ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-5">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </TableCell>
                      <TableCell className="pr-5">
                        <Skeleton className="size-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : orders.data?.data.map((order: OrderEntry) => {
                    const s = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
                    const ps = paymentStatusConfig[order.paymentStatus] ?? { label: order.paymentStatus, variant: "outline" as const };

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="pl-5 font-medium">{order.orderCode}</TableCell>
                        <TableCell>{order.user?.name ?? order.user?.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {relativeDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.variant} className={s.variant === "outline" ? "bg-muted text-muted-foreground border-transparent" : ""}>
                            {s.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ps.variant} className={ps.variant === "outline" ? "bg-muted text-muted-foreground border-transparent" : ""}>
                            {ps.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(order.total))}</TableCell>
                        <TableCell className="pr-5">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <ArrowRightIcon className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {!orders.isLoading && orders.data?.data.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <ClipboardListIcon className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Không tìm thấy đơn hàng</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử tìm kiếm hoặc bộ lọc trạng thái khác.
              </p>
            </div>
          )}

          {orders.isError && (
            <div className="p-6 text-center text-sm text-destructive">
              {orders.error.message}
            </div>
          )}

          {pagination && (
            <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Dòng mỗi trang</span>
                <Select
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                  value={String(pageSize)}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>
                  {pagination.total === 0
                    ? "0"
                    : `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                        pagination.page * pagination.pageSize,
                        pagination.total,
                      )}`}{" "}
                  trong {pagination.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeftIcon />
                  Trước
                </Button>
                <Button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  size="sm"
                  variant="outline"
                >
                  Sau
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
