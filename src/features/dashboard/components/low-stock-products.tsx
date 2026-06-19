"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

export function LowStockProducts() {
  const { data, loading, error } = useDashboardDataContext();
  const products = data?.lowStockProducts ?? [];

  return (
    <Card className="col-span-full sm:col-span-2 shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle>Sản phẩm sắp hết hàng</CardTitle>
        <CardDescription>Tồn kho dưới 5 sản phẩm</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Đang tải...</p>
        ) : error ? (
          <p className="text-sm text-destructive py-4 text-center">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Tồn kho ổn định.</p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/dashboard/products`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(product.price))}
                  </p>
                </div>
                <Badge variant={product.stock === 0 ? "destructive" : "outline"}>
                  {product.stock === 0 ? "Hết" : `Còn ${product.stock}`}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
