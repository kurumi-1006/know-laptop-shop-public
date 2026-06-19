import { CheckoutPage as CheckoutPageContent } from "@/features/order/components/checkout-page";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Thanh toán | Know",
  description: "Xác nhận đơn hàng và địa chỉ giao hàng",
};

export default function CheckoutRoute() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-8" />}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  await connection();
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <CheckoutPageContent />
    </div>
  );
}
