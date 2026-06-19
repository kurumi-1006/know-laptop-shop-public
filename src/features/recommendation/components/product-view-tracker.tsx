"use client";

import { useEffect } from "react";

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/tracking/product-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
      signal: controller.signal,
    }).catch(() => {

    });

    return () => controller.abort();
  }, [productId]);

  return null;
}
