import { notFound } from "next/navigation";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";

import { ProductFacade } from "@/features/product/lib/product";
import { FeedbackFacade } from "@/features/feedback/lib/feedback";
import { getCurrentSession } from "@/features/auth/lib/session";
import prisma from "@/lib/prisma";

import { ProductGallery } from "@/features/product/components/product-gallery";
import { ProductReviews } from "@/features/product/components/product-reviews";
import type { ReviewData } from "@/features/product/components/product-reviews";
import { RelatedProducts } from "@/features/product/components/related-products";

import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/shared/back-button";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { ProductCartActions } from "@/features/cart/components/product-cart-actions";
import { ProductCoupons } from "@/features/product/components/product-coupons";
import { PRICE_LOCALE } from "@/lib/constants";
import { ProductViewTracker } from "@/features/recommendation/components/product-view-tracker";
import { RecommendationSection } from "@/features/recommendation/components/recommendation-section";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getPublicProduct = (slug: string) =>
  ProductFacade.getPublicProductDetailBySlug(slug);

const getCachedRelatedProducts = (productId: string, categoryId: string, brandId: string) => unstable_cache(
  async () => ProductFacade.getRelatedProducts(productId, categoryId, brandId, 4),
  [`related-products-${productId}`],
  { revalidate: 600 }
)();

const getCachedReviewStats = (productId: string) => unstable_cache(
  async () => FeedbackFacade.getStats(productId),
  [`product-stats-${productId}`],
  { revalidate: 300 }
)();

const getCachedInitialReviews = (productId: string) => unstable_cache(
  async () => FeedbackFacade.getPaginatedProductFeedbacks(productId, 1, 5),
  [`product-reviews-page1-${productId}`],
  { revalidate: 300 }
)();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);

  if (!product) {
    return { title: "Sản phẩm không tồn tại" };
  }

  return {
    title: `${product.name} | Tên Cửa Hàng`,
    description: product.description?.substring(0, 160) || `Mua ${product.name} chính hãng, giá tốt nhất.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);

  if (!product) {
    notFound();
  }

  const session = await getCurrentSession();
  const isLoggedIn = !!session?.user;
  let currentUserReview = null;
  let hasPurchased = false;

  if (session?.user) {
    const [review, purchasedOrder] = await Promise.all([
      prisma.feedback.findFirst({
        where: {
          userId: session.user.id,
          productId: product.id,
        },
      }),
      prisma.orders.findFirst({
        where: {
          userId: session.user.id,
          status: "completed",
          orderDetails: {
            some: { productId: product.id },
          },
        },
        select: { id: true },
      }),
    ]);
    currentUserReview = review;
    hasPurchased = !!purchasedOrder;
  }


  const [relatedProducts, stats, initialReviewsPage] = await Promise.all([
    getCachedRelatedProducts(product.id, product.categoryId, product.brandId),
    getCachedReviewStats(product.id),
    getCachedInitialReviews(product.id)
  ]);

  const hasSale = product.salePrice !== null && product.salePrice !== undefined;
  const displayPrice = Number(product.salePrice ?? product.price);
  const originalPrice = Number(product.price);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ProductViewTracker productId={product.id} />
      <BackButton fallback={`/products?category=${product.category?.slug ?? ''}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {                             }
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {                          }
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">{product.name}</h1>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
              Thương hiệu: <span className="text-primary">{product.brand?.name}</span>
            </span>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <span className="text-yellow-400">★</span>
              <span className="font-medium text-foreground">{stats.averageRating}</span>
              <span>({stats.totalCount} đánh giá)</span>
            </div>
          </div>

          {             }
          <div className="p-4 bg-muted/30 rounded-lg border mb-6">
            {hasSale ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-red-500">
                    {displayPrice.toLocaleString(PRICE_LOCALE)} VND
                  </span>
                  <span className="text-lg text-muted-foreground line-through mb-1">
                    {originalPrice.toLocaleString(PRICE_LOCALE)} VND
                  </span>
                </div>
                {product.salePrice && product.price && (
                  <Badge className="w-fit bg-red-100 text-red-600 hover:bg-red-100 border-red-200">
                    Tiết kiệm {Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)}%
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-3xl font-bold text-foreground">
                {originalPrice.toLocaleString(PRICE_LOCALE)} VND
              </span>
            )}
          </div>

          {                       }
          <ProductCoupons coupons={product.productCoupons} />

          {                       }
          {product.description && (
            <div className="prose prose-sm dark:prose-invert mb-6 line-clamp-4 text-muted-foreground">
              {product.description}
            </div>
          )}

          {                         }
          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium">Tình trạng:</span>
              {product.stock > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">
                  Còn hàng ({product.stock})
                </Badge>
              ) : (
                <Badge variant="destructive">Tạm hết hàng</Badge>
              )}
            </div>

            <ProductCartActions
              productId={product.id}
              stock={product.stock}
              wishlistButton={
                <WishlistButton productId={product.id} size="md" className="h-12 w-12 shrink-0" />
              }
            />
          </div>
        </div>
      </div>

      {                          }
      {product.specs && product.specs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 tracking-tight">Thông số kỹ thuật</h2>
          <div className="border rounded-lg overflow-hidden max-w-3xl">
            <table className="w-full text-sm text-left">
              <tbody>
                {product.specs.map((spec: { id: string; value: string; attribute: { name: string; groupName: string | null } }, index: number) => (
                  <tr
                    key={spec.id}
                    className={`border-b last:border-0 hover:bg-muted/50 ${index % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
                  >
                    <th className="py-3 px-4 font-medium text-muted-foreground w-1/3">
                      {spec.attribute.name}
                    </th>
                    <td className="py-3 px-4 font-medium">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {                     }
      <ProductReviews
        productId={product.id}
        initialReviews={initialReviewsPage.data as ReviewData[]}
        initialTotal={initialReviewsPage.total}
        stats={stats}
        currentUserReview={currentUserReview as ReviewData | null}
        isLoggedIn={isLoggedIn}
        hasPurchased={hasPurchased}
      />

      {                              }
      <RelatedProducts products={relatedProducts} />
      <RecommendationSection compact excludeProductId={product.id} limit={4} />
    </div>
  );
}
