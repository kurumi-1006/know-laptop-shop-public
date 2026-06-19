"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRemoveFromWishlist,
  useWishlist,
} from "@/features/wishlist/hooks/use-wishlist";
import { PRICE_LOCALE, ROUTES } from "@/lib/constants";
import { HeartIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export function WishlistPage() {
  const { data: wishlist, isLoading, error } = useWishlist();
  const removeMutation = useRemoveFromWishlist();

  const handleRemove = (productId: string, productName: string) => {
    removeMutation.mutate(productId, {
      onSuccess: () => {
        toast.success(`Đã xóa "${productName}" khỏi yêu thích`);
      },
      onError: (err) => {
        toast.error(err.message || "Không thể xóa khỏi yêu thích");
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Sản phẩm yêu thích
        </h1>
        <p className="mt-1 text-muted-foreground">
          Các sản phẩm bạn đã lưu để xem lại sau.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="space-y-3" key={i}>
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="min-h-[50vh]">
        <EmptyHeader>
          <EmptyMedia>
            <HeartIcon className="size-12 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Đã xảy ra lỗi</EmptyTitle>
          <EmptyDescription>
            Không thể tải danh sách yêu thích. Vui lòng thử lại sau.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Sản phẩm yêu thích
        </h1>
        <p className="mt-1 text-muted-foreground">
          Các sản phẩm bạn đã lưu để xem lại sau.
        </p>
        <Empty className="mt-12 min-h-[40vh]">
          <EmptyHeader>
            <EmptyMedia>
              <HeartIcon className="size-16 text-muted-foreground/50" strokeWidth={1} />
            </EmptyMedia>
            <EmptyTitle className="text-lg">Chưa có sản phẩm yêu thích</EmptyTitle>
            <EmptyDescription>
              Bấm biểu tượng trái tim trên các sản phẩm để lưu lại và xem sau.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={ROUTES.products}>
                <ShoppingBagIcon className="mr-2 size-4" />
                Khám phá sản phẩm
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sản phẩm yêu thích
          </h1>
          <p className="mt-1 text-muted-foreground">
            {wishlist.length} sản phẩm đã lưu
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {wishlist.map((item) => {
          const product = item.product;
          if (!product) return null;

          const primaryImage = product.images[0]?.imageUrl;
          const hasSale =
            product.salePrice !== null && product.salePrice !== undefined;
          const displayPrice = Number(product.salePrice ?? product.price);
          const originalPrice = Number(product.price);

          return (
            <div
              className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
              key={item.id}
            >
              {                   }
              <button
                aria-label={`Xóa "${product.name}" khỏi yêu thích`}
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border shadow-sm transition-all hover:bg-destructive hover:text-destructive-foreground hover:scale-110 active:scale-95"
                disabled={removeMutation.isPending}
                onClick={() => handleRemove(item.productId, product.name)}
                type="button"
              >
                <Trash2Icon className="size-4" />
              </button>

              <Link
                className="block"
                href={`/products/${product.slug}`}
              >
                {           }
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {primaryImage ? (
                    <Image
                      alt={product.name}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={primaryImage}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      Không có ảnh
                    </div>
                  )}

                  {                          }
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                      <span className="rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground">
                        HẾT HÀNG
                      </span>
                    </div>
                  )}
                </div>

                {          }
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">
                    {product.brand.name}
                    {product.category ? ` · ${product.category.name}` : ""}
                  </p>
                  <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold transition-colors group-hover:text-primary">
                    {product.name}
                  </h3>

                  {           }
                  <div className="mt-2">
                    {hasSale ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-bold text-red-500">
                          {displayPrice.toLocaleString(PRICE_LOCALE)} VND
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          {originalPrice.toLocaleString(PRICE_LOCALE)} VND
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-bold">
                        {originalPrice.toLocaleString(PRICE_LOCALE)} VND
                      </span>
                    )}
                  </div>

                  {           }
                  <div className="mt-2 text-xs text-muted-foreground">
                    {product.stock > 0
                      ? `Còn ${product.stock} máy`
                      : "Tạm hết hàng"}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
