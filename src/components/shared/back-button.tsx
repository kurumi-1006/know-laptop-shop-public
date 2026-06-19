"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallback }: { fallback?: string }) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else if (fallback) {
            router.push(fallback);
          } else {
            router.push("/");
          }
        }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Quay lại
      </button>
    </div>
  );
}
