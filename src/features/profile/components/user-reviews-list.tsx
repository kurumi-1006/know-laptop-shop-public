"use client";

import { useState } from "react";
import { Star, AlertCircle, ShoppingBag, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { updateProductReview, deleteProductReview } from "@/features/product/actions/feedback-actions";

type UserReview = { id: string; rating: number; content: string | null; createdAt: Date | string; product: { id: string; name: string; slug: string } };

interface UserReviewsListProps {
  initialReviews: UserReview[];
}

export function UserReviewsList({ initialReviews }: UserReviewsListProps) {
  const [reviews, setReviews] = useState<UserReview[]>(initialReviews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editContent, setEditContent] = useState<string>("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = (review: UserReview) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content || "");
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (editRating < 1 || editRating > 5) {
      setError("Vui lòng chọn số sao từ 1 đến 5");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await updateProductReview(id, editRating, editContent);

    if (res.success && res.data) {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, rating: editRating, content: editContent, updatedAt: new Date() } : r))
      );
      setEditingId(null);
    } else {
      setError(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    setIsSubmitting(true);
    setError(null);

    const res = await deleteProductReview(id);

    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      setError(res.error);
    }
    setIsSubmitting(false);
  };

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-2xl bg-muted/10 min-h-[350px]">
        <ShoppingBag className="size-12 text-muted-foreground/40 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-bold">Bạn chưa viết đánh giá nào</h3>
        <p className="text-muted-foreground text-xs max-w-xs mt-2">
          Sau khi mua hàng, bạn có thể quay lại trang chi tiết sản phẩm để viết nhận xét đánh giá chất lượng.
        </p>
        <Button asChild className="mt-5 text-xs font-semibold bg-[primary] hover:bg-[primary]/90 text-white" size="sm">
          <Link href="/products">Mua sắm ngay</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs rounded-lg font-medium border border-destructive/20 mb-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {reviews.map((review) => {
        const isEditing = editingId === review.id;

        return (
          <Card key={review.id} className="overflow-hidden border bg-card/60 transition-all">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3">
                {                                   }
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sản phẩm</span>
                    <Link
                      href={`/products/${review.product?.slug}`}
                      className="block text-sm font-bold text-primary hover:underline leading-snug"
                    >
                      {review.product?.name}
                    </Link>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(review)}
                        disabled={isSubmitting}
                        className="h-8 text-xs font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(review.id)}
                        disabled={isSubmitting}
                        className="h-8 text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (

                  <div className="space-y-4 pt-2">
                    {                    }
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Chọn số sao</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isFilled = hoveredStar !== null
                            ? starValue <= hoveredStar
                            : starValue <= editRating;
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onClick={() => setEditRating(starValue)}
                              onMouseEnter={() => setHoveredStar(starValue)}
                              onMouseLeave={() => setHoveredStar(null)}
                              className="focus:outline-hidden text-yellow-400"
                            >
                              <Star
                                className={`w-6 h-6 ${isFilled ? "fill-current" : "text-muted-foreground/30"}`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {              }
                    <div className="space-y-1">
                      <label htmlFor={`edit-text-${review.id}`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Nội dung nhận xét</label>
                      <Textarea
                        id={`edit-text-${review.id}`}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] text-sm rounded-lg"
                        placeholder="Cảm nhận của bạn về sản phẩm..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(review.id)}
                        disabled={isSubmitting}
                        className="bg-[primary] hover:bg-[primary]/90 text-white font-semibold text-xs h-8 px-3 rounded-lg"
                      >
                        Lưu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        className="font-semibold text-xs h-8 px-3 rounded-lg"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (

                  <div className="pt-1">
                    {                  }
                    <div className="flex items-center gap-0.5 mb-2 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-current" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    {                    }
                    {review.content ? (
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {review.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Không có nội dung bình luận.</p>
                    )}

                    <span className="text-[10px] text-muted-foreground mt-3 block">
                      Đăng ngày: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
