"use client";

import { useState } from "react";
import { Star, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  fetchProductReviews,
  submitProductReview,
  updateProductReview,
  deleteProductReview
} from "@/features/product/actions/feedback-actions";

export type ReviewData = { id: string; rating: number; content: string | null; createdAt: Date | string; updatedAt?: Date | string; user?: { name: string | null; email?: string; image?: string | null }; product?: { id: string; name: string; slug: string } };

interface ProductReviewsProps {
  productId: string;
  initialReviews: ReviewData[];
  initialTotal: number;
  stats: {
    averageRating: number;
    totalCount: number;
    breakdown: Record<number, number>;
  };
  currentUserReview?: ReviewData | null;
  isLoggedIn?: boolean;
  hasPurchased?: boolean;
}

const PAGE_SIZE = 5;

export function ProductReviews({
  productId,
  initialReviews,
  initialTotal,
  stats,
  currentUserReview = null,
  isLoggedIn = false,
  hasPurchased = false
}: ProductReviewsProps) {
  const pathname = usePathname();
  const [reviews, setReviews] = useState(initialReviews);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialTotal > PAGE_SIZE);


  const [userReview, setUserReview] = useState(currentUserReview);
  const [isEditing, setIsEditing] = useState(false);
  const [ratingInput, setRatingInput] = useState(currentUserReview?.rating ?? 5);
  const [contentInput, setContentInput] = useState(currentUserReview?.content ?? "");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadMore = async () => {
    setIsLoading(true);
    const nextPage = page + 1;
    const { data, total, error } = await fetchProductReviews(productId, nextPage, PAGE_SIZE);

    if (!error && data) {
      setReviews((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(reviews.length + data.length < total);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingInput < 1 || ratingInput > 5) {
      setSubmitError("Vui lòng chọn số sao từ 1 đến 5");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = userReview
      ? await updateProductReview(userReview.id, ratingInput, contentInput)
      : await submitProductReview(productId, ratingInput, contentInput);

    if (res.success && res.data) {
      setUserReview(res.data);
      setIsEditing(false);
      window.location.reload();
    } else {
      setSubmitError(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!userReview) return;
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await deleteProductReview(userReview.id);
    if (res.success) {
      setUserReview(null);
      setRatingInput(5);
      setContentInput("");
      setIsEditing(false);
      window.location.reload();
    } else {
      setSubmitError(res.error);
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = () => {
    setRatingInput(userReview?.rating ?? 5);
    setContentInput(userReview?.content ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSubmitError(null);
  };

  return (
    <div className="w-full mt-12">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">Đánh giá sản phẩm</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {                   }
        <div className="md:col-span-1 bg-muted/30 p-6 rounded-lg border h-fit">
          <div className="text-center mb-6">
            <h3 className="text-4xl font-extrabold text-foreground">{stats.averageRating}/5</h3>
            <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(stats.averageRating) ? "fill-current" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{stats.totalCount} đánh giá</p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.breakdown[star] || 0;
              const percentage = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 w-8 text-muted-foreground">
                    {star} <Star className="w-3.5 h-3.5 fill-current" />
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {                                      }
        <div className="md:col-span-2 space-y-6">

          {                                 }
          {isLoggedIn ? (
            hasPurchased || currentUserReview ? (
              userReview && !isEditing ? (

                <Card className="border-[primary]/30 bg-[primary]/5 shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4 border-b border-[primary]/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[primary]">Đánh giá của bạn</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleStartEdit} className="h-8 text-xs font-semibold">
                          Sửa
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting} className="h-8 text-xs font-semibold">
                          Xóa
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= userReview.rating ? "fill-current" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    {userReview.content ? (
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{userReview.content}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Không có nội dung bình luận.</p>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-3 block">
                      Cập nhật lúc: {new Date(userReview.updatedAt ?? "").toLocaleString('vi-VN')}
                    </span>
                  </CardContent>
                </Card>
              ) : (

                <Card className="border bg-card shadow-xs">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-base mb-4 text-foreground">
                      {userReview ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá sản phẩm"}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {                   }
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">Chọn số sao đánh giá</label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((starValue) => {
                            const isFilled = hoveredStar !== null
                              ? starValue <= hoveredStar
                              : starValue <= ratingInput;
                            return (
                              <button
                                key={starValue}
                                type="button"
                                onClick={() => setRatingInput(starValue)}
                                onMouseEnter={() => setHoveredStar(starValue)}
                                onMouseLeave={() => setHoveredStar(null)}
                                className="focus:outline-hidden text-yellow-400 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 ${isFilled ? "fill-current" : "text-muted-foreground/40"}`}
                                />
                              </button>
                            );
                          })}
                          <span className="text-sm font-semibold ml-2 text-muted-foreground">
                            {ratingInput === 5 ? "Rất tốt" : ratingInput === 4 ? "Tốt" : ratingInput === 3 ? "Bình thường" : ratingInput === 2 ? "Tệ" : "Rất tệ"}
                          </span>
                        </div>
                      </div>

                      {                     }
                      <div className="space-y-1.5">
                        <label htmlFor="comment-text" className="text-xs font-semibold text-muted-foreground block">Nội dung đánh giá</label>
                        <Textarea
                          id="comment-text"
                          placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này (chất lượng, hiệu năng, giao hàng...)"
                          value={contentInput}
                          onChange={(e) => setContentInput(e.target.value)}
                          className="min-h-[100px] resize-y rounded-xl"
                          maxLength={1000}
                        />
                      </div>

                      {submitError && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs rounded-lg font-medium border border-destructive/20">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-1">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-[primary] hover:bg-[primary]/90 text-white font-semibold text-xs h-9 px-4 rounded-lg"
                        >
                          {isSubmitting ? "Đang xử lý..." : userReview ? "Lưu thay đổi" : "Gửi đánh giá"}
                        </Button>

                        {userReview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                            className="font-semibold text-xs h-9 px-4 rounded-lg"
                          >
                            Hủy
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )
            ) : (

              <div className="p-5 border border-dashed rounded-xl bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Bạn chưa thể đánh giá sản phẩm này</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Chỉ khách hàng đã mua và nhận hàng thành công mới có thể viết đánh giá.</p>
                </div>
              </div>
            )
          ) : (

            <div className="p-5 border border-dashed rounded-xl bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-foreground">Bạn muốn đánh giá sản phẩm này?</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Vui lòng đăng nhập tài khoản để có thể viết đánh giá của bạn.</p>
              </div>
              <Button asChild size="sm" className="bg-[primary] hover:bg-[primary]/90 text-white font-bold text-xs h-9 px-4 rounded-lg shrink-0">
                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                  Đăng nhập ngay
                </Link>
              </Button>
            </div>
          )}

          {                                                  }
          <div className="border-t pt-6">
            <h3 className="font-bold text-lg mb-4 text-foreground">Tất cả nhận xét ({initialTotal})</h3>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center p-8 bg-muted/10 rounded-lg border border-dashed">
                  <p className="text-muted-foreground text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              ) : (
                reviews.map((review) => {

                  if (userReview && review.id === userReview.id) return null;

                  return (
                    <Card key={review.id} className="shadow-xs border bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {review.user?.image ? (
                              <img src={review.user.image ?? undefined} alt={review.user.name ?? undefined} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-xs truncate">{review.user?.name || "Người dùng"}</h4>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mb-2 text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-current" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                            {review.content && (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{review.content}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="font-semibold text-xs"
                  >
                    {isLoading ? "Đang tải..." : "Xem thêm đánh giá"}
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

