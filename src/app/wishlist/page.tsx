import { WishlistPage as WishlistPageContent } from "@/features/wishlist/components/wishlist-page";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Yêu thích | Know",
  description: "Danh sách sản phẩm yêu thích của bạn",
};

export default function WishlistRoute() {
  return (
    <Suspense fallback={<WishlistFallback />}>
      <WishlistContent />
    </Suspense>
  );
}

async function WishlistContent() {
  await connection();
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <WishlistPageContent />
    </div>
  );
}

function WishlistFallback() {
  return <div className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-8" />;
}
