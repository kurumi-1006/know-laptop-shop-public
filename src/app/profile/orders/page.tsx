import { OrderListClient } from "@/features/order/components/order-list-client";
import { AccountNavigation } from "@/features/profile/components/account-navigation";
import { PackageIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Đơn hàng | Know",
  description: "Xem và quản lý các đơn hàng của bạn",
};

export default function OrderListPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <PackageIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Đơn hàng của tôi</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Xem và quản lý các đơn hàng bạn đã đặt.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNavigation />
          <div className="min-w-0">
            <OrderListClient />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
