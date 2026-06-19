import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
    orders: {
      findFirst: vi.fn(),
    },
    feedback: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { FeedbackFacade } from "./feedback";

describe("FeedbackFacade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsert", () => {
    it("should reject feedback ratings outside 1-5 range", async () => {
      await expect(
        FeedbackFacade.upsert({
          userId: "user-1",
          productId: "product-1",
          rating: 0,
        })
      ).rejects.toThrow("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.");

      await expect(
        FeedbackFacade.upsert({
          userId: "user-1",
          productId: "product-1",
          rating: 6,
        })
      ).rejects.toThrow("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.");
    });

    it("should reject feedback if product does not exist", async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      await expect(
        FeedbackFacade.upsert({
          userId: "user-1",
          productId: "product-invalid",
          rating: 5,
        })
      ).rejects.toThrow("Product with ID product-invalid does not exist.");
    });

    it("should reject feedback if user has not purchased the product", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({ id: "product-1" });
      (prisma.orders.findFirst as any).mockResolvedValue(null);

      await expect(
        FeedbackFacade.upsert({
          userId: "user-1",
          productId: "product-1",
          rating: 5,
        })
      ).rejects.toThrow(
        "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua hàng thành công."
      );
    });

    it("should successfully upsert feedback if rating, product, and purchase are valid", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({ id: "product-1" });
      (prisma.orders.findFirst as any).mockResolvedValue({ id: "order-1" });
      (prisma.feedback.upsert as any).mockResolvedValue({
        id: "fb-1",
        rating: 5,
        content: "Great product!",
      });

      const result = await FeedbackFacade.upsert({
        userId: "user-1",
        productId: "product-1",
        rating: 5,
        content: "Great product!",
      });

      expect(prisma.feedback.upsert).toHaveBeenCalledWith({
        where: {
          userId_productId: {
            userId: "user-1",
            productId: "product-1",
          },
        },
        update: {
          rating: 5,
          content: "Great product!",
          isVisible: true,
        },
        create: {
          userId: "user-1",
          productId: "product-1",
          rating: 5,
          content: "Great product!",
        },
      });

      expect(result.id).toBe("fb-1");
    });
  });

  describe("update", () => {
    it("should reject update if user is not the owner of the feedback", async () => {
      (prisma.feedback.findUnique as any).mockResolvedValue({
        id: "fb-1",
        userId: "user-different",
      });

      await expect(
        FeedbackFacade.update("fb-1", "user-1", { rating: 4 })
      ).rejects.toThrow("Bạn không có quyền chỉnh sửa phản hồi này.");
    });
  });
});
