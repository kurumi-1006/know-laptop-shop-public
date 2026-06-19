"use client";

import { useEffect, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

interface LiveStockProps {
  productId: number | string;
  initialStock: number;
  productSlug?: string;
}

export function LiveStock({ productId, initialStock, productSlug }: LiveStockProps) {
  const [stock, setStock] = useState(initialStock);
  const queryClient = useQueryClient();

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  useSupabaseRealtime({
    channelName: `product-stock-${productId}`,
    table: "products",
    event: "UPDATE",
    filter: `id=eq.${productId}`,
    callback: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productSlug ?? productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.stock !== undefined) {
            setStock(data.data.stock);
          }
        })
        .catch(() => {

        });
    },
  });

  return (
    <Badge variant={stock > 0 ? "outline" : "destructive"} className="text-sm">
      {stock > 0 ? `${stock} máy` : "Hết hàng"}
    </Badge>
  );
}
