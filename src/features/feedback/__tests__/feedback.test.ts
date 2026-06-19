import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedbackFacade } from "../lib/feedback";
import prisma from "@/lib/prisma";


vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    feedback: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    orders: {
      findFirst: vi.fn(),
    },
  };
  return {
    default: mockPrisma,
  };
});

describe("FeedbackFacade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProductFeedbacks", () => {
    it("should retrieve only visible feedbacks of a product sorted by date", async () => {
      const mockFeedbacks = [
        { id: "fb1", rating: 5, content: "Great product", isVisible: true, createdAt: new Date() },
        { id: "fb2", rating: 4, content: "Good product", isVisible: true, createdAt: new Date() },
      ];
      vi.mocked(prisma.feedback.findMany).mockResolvedValue(mockFeedbacks as any);

      const result = await FeedbackFacade.getProductFeedbacks("prod_1");

      expect(prisma.feedback.findMany).toHaveBeenCalledWith({
        where: {
          productId: "prod_1",
          isVisible: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockFeedbacks);
    });
  });

  describe("getPaginatedProductFeedbacks", () => {
    it("should retrieve visible product feedbacks with pagination and count them", async () => {
      const mockFeedbacks = [
        { id: "fb1", rating: 5, content: "Great product", isVisible: true, createdAt: new Date() },
      ];
      vi.mocked(prisma.feedback.findMany).mockResolvedValue(mockFeedbacks as any);
      vi.mocked(prisma.feedback.count).mockResolvedValue(10);

      const result = await FeedbackFacade.getPaginatedProductFeedbacks("prod_1", 2, 5);

      expect(prisma.feedback.findMany).toHaveBeenCalledWith({
        where: {
          productId: "prod_1",
          isVisible: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: 5,
        take: 5,
      });
      expect(prisma.feedback.count).toHaveBeenCalledWith({
        where: {
          productId: "prod_1",
          isVisible: true,
        },
      });
      expect(result).toEqual({ data: mockFeedbacks, total: 10 });
    });
  });

  describe("getUserFeedbacks", () => {
    it("should retrieve all feedbacks of a specific user with product info", async () => {
      const mockUserFeedbacks = [
        { id: "fb1", rating: 5, content: "Excellent", product: { id: "p1", name: "Laptop X", slug: "laptop-x" } },
      ];
      vi.mocked(prisma.feedback.findMany).mockResolvedValue(mockUserFeedbacks as any);

      const result = await FeedbackFacade.getUserFeedbacks("user_123");

      expect(prisma.feedback.findMany).toHaveBeenCalledWith({
        where: { userId: "user_123" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockUserFeedbacks);
    });
  });

  describe("upsert (Create/Update with validation)", () => {
    it("should throw error if rating is less than 1", async () => {
      await expect(
        FeedbackFacade.upsert({ userId: "u1", productId: "p1", rating: 0, content: "Bad" })
      ).rejects.toThrow("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.");
    });

    it("should throw error if rating is more than 5", async () => {
      await expect(
        FeedbackFacade.upsert({ userId: "u1", productId: "p1", rating: 6, content: "Super" })
      ).rejects.toThrow("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.");
    });

    it("should throw error if product does not exist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        FeedbackFacade.upsert({ userId: "u1", productId: "p-invalid", rating: 5, content: "Nice" })
      ).rejects.toThrow("Product with ID p-invalid does not exist.");

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "p-invalid" },
      });
    });

    it("should throw error if the user has not purchased the product with a completed order", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "p1", name: "Laptop X" } as any);
      vi.mocked(prisma.orders.findFirst).mockResolvedValue(null);

      await expect(
        FeedbackFacade.upsert({ userId: "u1", productId: "p1", rating: 5, content: "Nice" })
      ).rejects.toThrow("Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua hàng thành công.");

      expect(prisma.orders.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          status: "completed",
          orderDetails: {
            some: { productId: "p1" },
          },
        },
      });
    });

    it("should perform upsert if all validations pass", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "p1", name: "Laptop X" } as any);
      vi.mocked(prisma.orders.findFirst).mockResolvedValue({ id: "order1", status: "completed" } as any);
      const mockUpsertResult = { id: "fb1", userId: "u1", productId: "p1", rating: 5, content: "Nice", isVisible: true };
      vi.mocked(prisma.feedback.upsert).mockResolvedValue(mockUpsertResult as any);

      const result = await FeedbackFacade.upsert({ userId: "u1", productId: "p1", rating: 5, content: "Nice" });

      expect(prisma.feedback.upsert).toHaveBeenCalledWith({
        where: {
          userId_productId: {
            userId: "u1",
            productId: "p1",
          },
        },
        update: {
          rating: 5,
          content: "Nice",
          isVisible: true,
        },
        create: {
          userId: "u1",
          productId: "p1",
          rating: 5,
          content: "Nice",
        },
      });
      expect(result).toEqual(mockUpsertResult);
    });
  });

  describe("update (Customer updates their own feedback)", () => {
    it("should throw error if feedback does not exist", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue(null);

      await expect(
        FeedbackFacade.update("fb-invalid", "u1", { rating: 4, content: "Okay" })
      ).rejects.toThrow("Feedback with ID fb-invalid does not exist.");
    });

    it("should throw error if feedback does not belong to the user", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue({ id: "fb1", userId: "owner-user", productId: "p1" } as any);

      await expect(
        FeedbackFacade.update("fb1", "attacker-user", { rating: 4, content: "Hacked" })
      ).rejects.toThrow("Bạn không có quyền chỉnh sửa phản hồi này.");
    });

    it("should throw error if update rating is out of range", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue({ id: "fb1", userId: "u1", productId: "p1" } as any);

      await expect(
        FeedbackFacade.update("fb1", "u1", { rating: 6, content: "Super" })
      ).rejects.toThrow("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.");
    });

    it("should update feedback if owner and rating are valid", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue({ id: "fb1", userId: "u1", productId: "p1" } as any);
      const mockUpdated = { id: "fb1", rating: 4, content: "Good enough" };
      vi.mocked(prisma.feedback.update).mockResolvedValue(mockUpdated as any);

      const result = await FeedbackFacade.update("fb1", "u1", { rating: 4, content: "Good enough" });

      expect(prisma.feedback.update).toHaveBeenCalledWith({
        where: { id: "fb1" },
        data: { rating: 4, content: "Good enough" },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe("delete (Customer deletes their own feedback)", () => {
    it("should throw error if feedback does not exist", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue(null);

      await expect(
        FeedbackFacade.delete("fb-invalid", "u1")
      ).rejects.toThrow("Feedback with ID fb-invalid does not exist.");
    });

    it("should throw error if feedback does not belong to the user", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue({ id: "fb1", userId: "owner-user" } as any);

      await expect(
        FeedbackFacade.delete("fb1", "attacker-user")
      ).rejects.toThrow("Bạn không có quyền xóa phản hồi này.");
    });

    it("should delete feedback successfully if user is owner", async () => {
      vi.mocked(prisma.feedback.findUnique).mockResolvedValue({ id: "fb1", userId: "u1" } as any);
      vi.mocked(prisma.feedback.delete).mockResolvedValue({ id: "fb1" } as any);

      const result = await FeedbackFacade.delete("fb1", "u1");

      expect(prisma.feedback.delete).toHaveBeenCalledWith({
        where: { id: "fb1" },
      });
      expect(result).toEqual({ id: "fb1" });
    });
  });

  describe("setVisibility", () => {
    it("should set visibility of a feedback correctly", async () => {
      vi.mocked(prisma.feedback.update).mockResolvedValue({ id: "fb1", isVisible: false } as any);

      const result = await FeedbackFacade.setVisibility("fb1", false);

      expect(prisma.feedback.update).toHaveBeenCalledWith({
        where: { id: "fb1" },
        data: { isVisible: false },
      });
      expect(result).toEqual({ id: "fb1", isVisible: false });
    });
  });

  describe("getStats", () => {
    it("should compute average rating and star breakdown for a product", async () => {
      vi.mocked(prisma.feedback.aggregate).mockResolvedValue({
        _avg: { rating: 4.25 },
        _count: { rating: 8 },
      } as any);
      vi.mocked(prisma.feedback.groupBy).mockResolvedValue([
        { rating: 5, _count: { rating: 4 } },
        { rating: 4, _count: { rating: 3 } },
        { rating: 2, _count: { rating: 1 } },
      ] as any);

      const result = await FeedbackFacade.getStats("prod_1");

      expect(prisma.feedback.aggregate).toHaveBeenCalledWith({
        where: { productId: "prod_1", isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      expect(prisma.feedback.groupBy).toHaveBeenCalledWith({
        by: ["rating"],
        where: { productId: "prod_1", isVisible: true },
        _count: { rating: true },
      });
      expect(result).toEqual({
        averageRating: 4.3,
        totalCount: 8,
        breakdown: {
          1: 0,
          2: 1,
          3: 0,
          4: 3,
          5: 4,
        },
      });
    });

    it("should return default empty stats if no feedbacks are found", async () => {
      vi.mocked(prisma.feedback.aggregate).mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as any);
      vi.mocked(prisma.feedback.groupBy).mockResolvedValue([]);

      const result = await FeedbackFacade.getStats("prod_empty");

      expect(result).toEqual({
        averageRating: 0,
        totalCount: 0,
        breakdown: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      });
    });
  });
});
