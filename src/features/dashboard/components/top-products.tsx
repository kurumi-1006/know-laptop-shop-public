"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

export function TopProducts() {
  const { data, loading, error } = useDashboardDataContext();
  const products = data?.topProducts ?? [];

  return (
    <Card className="col-span-full sm:col-span-2 shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle>Sản phẩm bán chạy</CardTitle>
        <CardDescription>Top sản phẩm theo số lượng đã bán</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Đang tải...</p>
        ) : error ? (
          <p className="text-sm text-destructive py-4 text-center">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có dữ liệu bán hàng.</p>
        ) : (
          <div className="space-y-3">
            {products.map((item, index) => {
              const price = item.product.salePrice ?? item.product.price;
              return (
                <Link
                  key={item.product.id}
                  href={`/products/${item.product.slug}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <span className="font-semibold text-muted-foreground text-sm w-5 text-center">
                    {index + 1}
                  </span>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
                    {item.product.images?.[0]?.imageUrl ? (
                      <Image
                        src={item.product.images[0].imageUrl}
                        alt={item.product.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <TrendingUpIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Đã bán: {item.totalSold} · {formatCurrency(Number(price))}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
