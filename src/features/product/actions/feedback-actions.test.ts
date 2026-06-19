import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchProductReviews,
  submitProductReview,
  updateProductReview,
  deleteProductReview,
} from "./feedback-actions";
import { FeedbackFacade } from "@/features/feedback/lib/feedback";
import { getCurrentSession } from "@/features/auth/lib/session";
import { revalidatePath } from "next/cache";


vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));


vi.mock("@/features/auth/lib/session", () => ({
  getCurrentSession: vi.fn(),
}));


vi.mock("@/features/feedback/lib/feedback", () => ({
  FeedbackFacade: {
    getPaginatedProductFeedbacks: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Feedback Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchProductReviews", () => {
    it("should fetch product reviews successfully", async () => {
      const mockResult = {
        data: [{ id: "fb1", rating: 5, content: "Perfect!" }],
        total: 1,
      };
      vi.mocked(FeedbackFacade.getPaginatedProductFeedbacks).mockResolvedValue(mockResult as any);

      const res = await fetchProductReviews("prod1", 1, 5);

      expect(FeedbackFacade.getPaginatedProductFeedbacks).toHaveBeenCalledWith("prod1", 1, 5);
      expect(res).toEqual({ data: mockResult.data, total: mockResult.total, error: null });
    });

    it("should return error message when error occurs", async () => {
      vi.mocked(FeedbackFacade.getPaginatedProductFeedbacks).mockRejectedValue(new Error("Database down"));

      const res = await fetchProductReviews("prod1", 1, 5);

      expect(res).toEqual({ data: [], total: 0, error: "Không thể tải đánh giá" });
    });
  });

  describe("submitProductReview", () => {
    it("should return error if user is not logged in", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue(null);

      const res = await submitProductReview("prod1", 5, "Good");

      expect(res).toEqual({ success: false, error: "Bạn cần đăng nhập để thực hiện" });
    });

    it("should submit review successfully and call revalidatePath", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: "user123" } } as any);
      vi.mocked(FeedbackFacade.upsert).mockResolvedValue({ id: "fb1" } as any);

      const res = await submitProductReview("prod1", 5, "Good");

      expect(FeedbackFacade.upsert).toHaveBeenCalledWith({
        userId: "user123",
        productId: "prod1",
        rating: 5,
        content: "Good",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/products");
      expect(res).toEqual({ success: true, data: { id: "fb1" }, error: null });
    });

    it("should return error message if facade upsert throws error", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: "user123" } } as any);
      vi.mocked(FeedbackFacade.upsert).mockRejectedValue(new Error("Chưa mua hàng"));

      const res = await submitProductReview("prod1", 5, "Good");

      expect(res).toEqual({ success: false, error: "Chưa mua hàng" });
    });
  });

  describe("updateProductReview", () => {
    it("should return error if user is not logged in", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue(null);

      const res = await updateProductReview("fb1", 4, "Updated");

      expect(res).toEqual({ success: false, error: "Bạn cần đăng nhập để thực hiện" });
    });

    it("should update review successfully and call revalidatePath", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: "user123" } } as any);
      vi.mocked(FeedbackFacade.update).mockResolvedValue({ id: "fb1" } as any);

      const res = await updateProductReview("fb1", 4, "Updated");

      expect(FeedbackFacade.update).toHaveBeenCalledWith("fb1", "user123", {
        rating: 4,
        content: "Updated",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/products");
      expect(res).toEqual({ success: true, data: { id: "fb1" }, error: null });
    });
  });

  describe("deleteProductReview", () => {
    it("should return error if user is not logged in", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue(null);

      const res = await deleteProductReview("fb1");

      expect(res).toEqual({ success: false, error: "Bạn cần đăng nhập để thực hiện" });
    });

    it("should delete review successfully and call revalidatePath", async () => {
      vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: "user123" } } as any);
      vi.mocked(FeedbackFacade.delete).mockResolvedValue({ id: "fb1" } as any);

      const res = await deleteProductReview("fb1");

      expect(FeedbackFacade.delete).toHaveBeenCalledWith("fb1", "user123");
      expect(revalidatePath).toHaveBeenCalledWith("/products");
      expect(res).toEqual({ success: true, error: null });
    });
  });
});
