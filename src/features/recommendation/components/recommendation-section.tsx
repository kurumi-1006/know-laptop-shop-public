"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendationResult } from "@/features/recommendation/lib/recommendation.types";
import { PRICE_LOCALE } from "@/lib/constants";
import { SparklesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function RecommendationSection({
  excludeProductId,
  limit = 6,
  compact = false,
}: {
  excludeProductId?: string;
  limit?: number;
  compact?: boolean;
}) {
  const [result, setResult] = useState<RecommendationResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: String(limit) });
    if (excludeProductId) params.set("excludeProductId", excludeProductId);

    void fetch(`/api/recommendations?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: RecommendationResult | null) => setResult(data))
      .catch(() => {

      });

    return () => controller.abort();
  }, [excludeProductId, limit]);

  if (!result?.items.length) return null;

  return (
    <section className={compact ? "mt-12" : "border-y bg-muted/20"}>
      <div className={compact ? "" : "mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"}>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <SparklesIcon className="size-4" />
          Dành riêng cho bạn
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Gợi ý cho bạn</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.hasHistory
            ? "Dựa trên lịch sử xem, tìm kiếm và mua hàng của bạn"
            : "Các sản phẩm bán chạy, mới và đang có giá tốt"}
        </p>

        <div className={`mt-8 grid gap-5 sm:grid-cols-2 ${compact ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {result.items.map((item) => {
            const displayPrice = item.salePrice ?? item.price;
            const hasSale = item.salePrice !== null && item.salePrice < item.price;

            return (
              <Card className="overflow-hidden" key={item.id}>
                <Link className="group block" href={`/products/${item.slug}`}>
                  <div className="relative aspect-[4/3] bg-muted">
                    {item.image ? (
                      <Image
                        alt={item.name}
                        className="object-cover transition-transform group-hover:scale-105"
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        src={item.image}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Không có ảnh
                      </div>
                    )}
                    {hasSale && <Badge className="absolute left-3 top-3">Đang giảm giá</Badge>}
                  </div>
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground">
                      {item.brand} · {item.category}
                    </p>
                    <CardTitle className="line-clamp-2 text-base">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-primary">
                        {displayPrice.toLocaleString(PRICE_LOCALE)} VND
                      </span>
                      {hasSale && (
                        <span className="text-xs text-muted-foreground line-through">
                          {item.price.toLocaleString(PRICE_LOCALE)} VND
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-3 min-h-15 text-xs leading-5 text-muted-foreground">
                      {item.reason}
                    </p>
                    <Button className="mt-4 w-full" size="sm" variant="outline">
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
