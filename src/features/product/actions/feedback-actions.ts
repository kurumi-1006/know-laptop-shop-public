"use server";

import { FeedbackFacade } from "@/features/feedback/lib/feedback";
import { getCurrentSession } from "@/features/auth/lib/session";
import { revalidatePath } from "next/cache";

export async function fetchProductReviews(productId: string, page: number, pageSize: number = 5) {
  try {
    const { data, total } = await FeedbackFacade.getPaginatedProductFeedbacks(productId, page, pageSize);
    return { data, total, error: null };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { data: [], total: 0, error: "Không thể tải đánh giá" };
  }
}

export async function submitProductReview(productId: string, rating: number, content: string) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện" };
    }
    
    const userId = session.user.id;
    const result = await FeedbackFacade.upsert({
      userId,
      productId,
      rating,
      content,
    });
    
    revalidatePath(`/products`);
    return { success: true, data: result, error: null };
  } catch (error: unknown) {
    console.error("Error submitting review:", error);
    const message = error instanceof Error ? error.message : "Không thể gửi đánh giá";
    return { success: false, error: message };
  }
}

export async function updateProductReview(feedbackId: string, rating: number, content: string) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện" };
    }

    const userId = session.user.id;
    const result = await FeedbackFacade.update(feedbackId, userId, { rating, content });

    revalidatePath(`/products`);
    return { success: true, data: result, error: null };
  } catch (error: unknown) {
    console.error("Error updating review:", error);
    const message = error instanceof Error ? error.message : "Không thể cập nhật đánh giá";
    return { success: false, error: message };
  }
}

export async function deleteProductReview(feedbackId: string) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện" };
    }

    const userId = session.user.id;
    await FeedbackFacade.delete(feedbackId, userId);

    revalidatePath(`/products`);
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Error deleting review:", error);
    const message = error instanceof Error ? error.message : "Không thể xóa đánh giá";
    return { success: false, error: message };
  }
}

