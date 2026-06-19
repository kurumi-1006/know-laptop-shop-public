import { CartPage as CartPageContent } from "@/features/cart/components/cart-page";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Giỏ hàng | Know",
  description: "Quản lý các sản phẩm trong giỏ hàng của bạn",
};

export default function CartRoute() {
  return (
    <Suspense fallback={<CartFallback />}>
      <CartContent />
    </Suspense>
  );
}

async function CartContent() {
  await connection();
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <CartPageContent />
    </div>
  );
}

function CartFallback() {
  return <div className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-8" />;
}
