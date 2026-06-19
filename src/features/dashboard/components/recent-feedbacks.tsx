"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

export function RecentFeedbacks() {
  const { data, loading, error } = useDashboardDataContext();
  const feedbacks = data?.recentFeedbacks ?? [];

  return (
    <Card className="col-span-full sm:col-span-2 shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle>Đánh giá gần đây</CardTitle>
        <CardDescription>5 đánh giá mới nhất từ khách hàng</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Đang tải...</p>
        ) : error ? (
          <p className="text-sm text-destructive py-4 text-center">{error}</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <Link
                key={fb.id}
                href={`/products/${fb.product.slug}`}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex shrink-0 items-center gap-0.5 text-amber-500">
                  {Array.from({ length: fb.rating }).map((_, i) => (
                    <StarIcon key={i} className="size-3 fill-current" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm line-clamp-2">{fb.content ?? "Không có nội dung."}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fb.user.name} · {fb.product.name} ·{" "}
                    {format(new Date(fb.createdAt), "dd/MM", { locale: vi })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
