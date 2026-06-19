"use client";

import { useState } from "react";
import { useFeedbacks, useUpdateFeedbackVisibility } from "@/features/admin/hooks/use-feedbacks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEARCH_DEBOUNCE_MS, SKELETON_ROW_COUNT } from "@/features/admin/constants";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import { toast } from "sonner";

type FeedbackRow = { id: number; rating: number; content: string | null; isVisible: boolean; createdAt: string; user: { name: string | null; email: string }; product: { id: number; name: string; slug: string } };

export function FeedbackManagement() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: feedbacksData, isLoading, isError, error } = useFeedbacks({
    page,
    pageSize,
    search: debouncedSearch,
    rating,
    status,
  });

  const updateVisibilityMutation = useUpdateFeedbackVisibility();

  const handleToggleVisibility = async (feedbackId: number, currentVisible: boolean) => {
    try {
      await updateVisibilityMutation.mutateAsync({
        feedbackId,
        isVisible: !currentVisible,
      });
      toast.success(currentVisible ? "Đã ẩn đánh giá này" : "Đã hiện lại đánh giá này");
    } catch (err) {
      toast.error("Không thể thay đổi trạng thái ẩn/hiện");
    }
  };

  const pagination = feedbacksData?.pagination;
  const stats = feedbacksData?.stats;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Quản lý cửa hàng</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Phản hồi sản phẩm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản trị các phản hồi, bình luận và đánh giá số sao của khách hàng đối với laptop.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng đánh giá", value: stats?.total },
          { label: "Đang hiển thị", value: stats?.visible },
          { label: "Đang ẩn", value: stats?.hidden },
          { label: "Đánh giá TB", value: stats?.averageRating, suffix: " ★" },
        ].map(({ label, value, suffix }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {isLoading && !feedbacksData ? (
                  <Skeleton className="mt-2 h-7 w-12" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold">
                    {value ?? 0}{suffix}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <MessageSquareIcon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Danh sách đánh giá</CardTitle>
              <CardDescription>
                {pagination?.total ?? 0} đánh giá trong hệ thống
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-64">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm nội dung, khách hàng..."
                  value={search}
                />
              </div>

              <Select
                onValueChange={(val) => {
                  setRating(val);
                  setPage(1);
                }}
                value={rating}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Số sao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả số sao</SelectItem>
                  {["5", "4", "3", "2", "1"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} sao ★
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
                value={status}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Hiển thị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hiển thị</SelectItem>
                  <SelectItem value="visible">Đang hiển thị</SelectItem>
                  <SelectItem value="hidden">Đang ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 w-16">STT</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead className="max-w-md">Nội dung</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-28 pr-5 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-5"><Skeleton className="h-4 w-6" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-5 text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                : feedbacksData?.data.map((fb: FeedbackRow, idx: number) => (
                    <TableRow key={fb.id}>
                      <TableCell className="pl-5 font-mono text-xs">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {fb.product.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{fb.user.name || "Khách hàng"}</p>
                          <p className="text-xs text-muted-foreground">{fb.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`size-3.5 ${
                                i < fb.rating ? "fill-yellow-500" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-sm truncate" title={fb.content ?? undefined}>
                        {fb.content || <span className="italic text-xs">Không có bình luận</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fb.isVisible ? "secondary" : "destructive"}>
                          {fb.isVisible ? "Hiển thị" : "Đang ẩn"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          size="sm"
                          variant={fb.isVisible ? "outline" : "default"}
                          onClick={() => handleToggleVisibility(fb.id, fb.isVisible)}
                          disabled={updateVisibilityMutation.isPending}
                          className="h-8 gap-1.5"
                        >
                          {fb.isVisible ? (
                            <>
                              <EyeOffIcon className="size-3.5" />
                              Ẩn đi
                            </>
                          ) : (
                            <>
                              <EyeIcon className="size-3.5" />
                              Hiển thị
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!isLoading && feedbacksData?.data.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <MessageSquareIcon className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Không tìm thấy đánh giá nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          )}

          {isError && (
            <div className="p-6 text-center text-sm text-destructive">
              {error.message}
            </div>
          )}

          {pagination && (
            <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Dòng mỗi trang</span>
                <Select
                  onValueChange={(val) => {
                    setPageSize(Number(val));
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
                        pagination.total
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
                  onClick={() => setPage((val) => val - 1)}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeftIcon />
                  Trước
                </Button>
                <Button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((val) => val + 1)}
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
