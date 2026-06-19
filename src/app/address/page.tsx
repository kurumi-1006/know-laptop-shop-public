import { AddressList } from "@/features/profile/components/address-list";
import { AccountNavigation } from "@/features/profile/components/account-navigation";
import { MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Addresses | Know",
  description: "Manage your saved delivery addresses",
};

export default function AddressPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <AddressContent />
    </Suspense>
  );
}

async function AddressContent() {
  await connection();
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <MapPinIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Địa chỉ giao hàng
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý địa chỉ dùng để giao laptop và thanh toán.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AccountNavigation />
        <div className="min-w-0">
          <AddressList />
        </div>
      </div>
    </div>
  );
}
