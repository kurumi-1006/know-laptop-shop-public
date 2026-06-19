"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Đã xảy ra lỗi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Không thể tải trang này. Dữ liệu tài khoản của bạn không bị thay đổi.
        </p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcwIcon />
          Thử lại
        </Button>
      </section>
    </main>
  );
}
