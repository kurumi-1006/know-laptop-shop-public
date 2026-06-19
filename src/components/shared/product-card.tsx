import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { PRICE_LOCALE } from "@/lib/constants";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number | null;
    stock: number;
    brand: { name: string };
    category?: { name: string } | null;
    images: Array<{ imageUrl: string }>;
    feedbacks?: Array<{ rating: number }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images[0]?.imageUrl;


  const feedbacks = product.feedbacks ?? [];
  const totalFeedbacks = feedbacks.length;
  const averageRating = totalFeedbacks > 0
    ? Number((feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedbacks).toFixed(1))
    : 0;

  const displayPrice = Number(product.salePrice ?? product.price);
  const originalPrice = Number(product.price);
  const hasSale = product.salePrice !== null && product.salePrice !== undefined;

  return (
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-all duration-300 border bg-card text-card-foreground relative">
      {                        }
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          {primaryImage ? (
            <Image
              alt={product.name}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              src={primaryImage}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
              Không có ảnh
            </div>
          )}

          {                }
          {hasSale && (
            <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white font-bold animate-pulse">
              GIẢM GIÁ
            </Badge>
          )}

          {                          }
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="text-sm font-semibold py-1 px-3">
                HẾT HÀNG
              </Badge>
            </div>
          )}
        </Link>

        {                                                                                           }
        <WishlistButton productId={product.id} size="sm" className="absolute top-3 right-3 z-10" />
      </div>

      {                          }
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1">
        <CardHeader className="space-y-1.5 p-4 flex-none">
          <CardDescription className="flex items-center justify-between text-xs">
            <span>{product.brand.name} {product.category ? `· ${product.category.name}` : ""}</span>
            {                                   }
            {product.stock > 0 ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Còn hàng</span>
            ) : (
              <span className="text-red-500 font-medium">Hết hàng</span>
            )}
          </CardDescription>
          <CardTitle className="text-base line-clamp-2 min-h-[3rem] font-bold group-hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex flex-col justify-between flex-1">
          {                   }
          <div className="flex flex-col gap-1">
            {hasSale ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-bold text-red-500">
                  {displayPrice.toLocaleString(PRICE_LOCALE)} VND
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice.toLocaleString(PRICE_LOCALE)} VND
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-foreground">
                {originalPrice.toLocaleString(PRICE_LOCALE)} VND
              </span>
            )}
          </div>

          {                              }
          <div className="mt-4 pt-3 border-t border-muted flex items-center justify-between text-xs text-muted-foreground">
            {            }
            <div className="flex items-center gap-1">
              <Star className={`size-3.5 ${totalFeedbacks > 0 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              {totalFeedbacks > 0 ? (
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <span>{averageRating}</span>
                  <span className="text-muted-foreground text-[10px]">({totalFeedbacks})</span>
                </div>
              ) : (
                <span className="text-[10px]">Chưa có đánh giá</span>
              )}
            </div>

            {                    }
            <span>
              {product.stock > 0 ? `Còn ${product.stock} máy` : "Tạm hết hàng"}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
