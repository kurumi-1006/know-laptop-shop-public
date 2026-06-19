import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    product: {
      findUnique: vi.fn(),
    },
    productImage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    default: mockPrisma,
  };
});

import prisma from "@/lib/prisma";
import { ProductImagesFacade } from "../lib/images";

describe("LaptopImage (ProductImagesFacade & ProductImagesRepository)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: Function) => fn(prisma)
    );
  });

  describe("getImages", () => {
    it("should return images in display order if product exists", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-123" } as any);

      const mockImages = [
        { id: "img-1", imageUrl: "url-1", isPrimary: true, displayOrder: 0 },
        { id: "img-2", imageUrl: "url-2", isPrimary: false, displayOrder: 1 },
      ];
      vi.mocked(prisma.productImage.findMany).mockResolvedValue(mockImages as any);

      const result = await ProductImagesFacade.getImages("prod-123");

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-123" },
      });
      expect(prisma.productImage.findMany).toHaveBeenCalledWith({
        where: { productId: "prod-123" },
        orderBy: { displayOrder: 'asc' },
      });
      expect(result).toEqual(mockImages);
    });

    it("should throw error if product does not exist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(ProductImagesFacade.getImages("non-existent")).rejects.toThrow(
        "Product with ID non-existent does not exist."
      );
    });
  });

  describe("addImage", () => {
    it("should add image and reset other primary images if added image is primary", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-123" } as any);
      vi.mocked(prisma.productImage.updateMany).mockResolvedValue({ count: 1 });

      const mockNewImage = {
        id: "img-new",
        productId: "prod-123",
        imageUrl: "url-new",
        isPrimary: true,
        displayOrder: 2,
      };
      vi.mocked(prisma.productImage.create).mockResolvedValue(mockNewImage as any);

      const result = await ProductImagesFacade.addImage({
        productId: "prod-123",
        imageUrl: "url-new",
        isPrimary: true,
        displayOrder: 2,
      });

      expect(prisma.productImage.updateMany).toHaveBeenCalledWith({
        where: { productId: "prod-123" },
        data: { isPrimary: false },
      });
      expect(prisma.productImage.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-123",
          imageUrl: "url-new",
          isPrimary: true,
          displayOrder: 2,
        },
      });
      expect(result).toEqual(mockNewImage);
    });
  });

  describe("updateImage", () => {
    it("should update image and reset other primary images if updated to primary", async () => {
      const existingImage = { id: "img-1", productId: "prod-123", imageUrl: "url-1", isPrimary: false };
      vi.mocked(prisma.productImage.findUnique).mockResolvedValue(existingImage as any);
      vi.mocked(prisma.productImage.updateMany).mockResolvedValue({ count: 1 });

      const mockUpdatedImage = { ...existingImage, isPrimary: true };
      vi.mocked(prisma.productImage.update).mockResolvedValue(mockUpdatedImage as any);

      const result = await ProductImagesFacade.updateImage("img-1", { isPrimary: true });

      expect(prisma.productImage.updateMany).toHaveBeenCalledWith({
        where: { productId: "prod-123" },
        data: { isPrimary: false },
      });
      expect(prisma.productImage.update).toHaveBeenCalledWith({
        where: { id: "img-1" },
        data: { isPrimary: true },
      });
      expect(result).toEqual(mockUpdatedImage);
    });
  });

  describe("deleteImage", () => {
    it("should delete image if it exists", async () => {
      vi.mocked(prisma.productImage.findUnique).mockResolvedValue({ id: "img-1" } as any);
      vi.mocked(prisma.productImage.delete).mockResolvedValue({ id: "img-1" } as any);

      const result = await ProductImagesFacade.deleteImage("img-1");

      expect(prisma.productImage.delete).toHaveBeenCalledWith({
        where: { id: "img-1" },
      });
      expect(result).toEqual({ id: "img-1" });
    });
  });

  describe("setImagesBatch", () => {
    it("should batch replace product images", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-123" } as any);
      vi.mocked(prisma.productImage.deleteMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.productImage.createMany).mockResolvedValue({ count: 2 } as any);

      const newImages = [
        { imageUrl: "url-1", isPrimary: true, displayOrder: 0 },
        { imageUrl: "url-2", isPrimary: false, displayOrder: 1 },
      ];

      await ProductImagesFacade.setImagesBatch("prod-123", newImages);

      expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({
        where: { productId: "prod-123" },
      });
      expect(prisma.productImage.createMany).toHaveBeenCalledWith({
        data: [
          { productId: "prod-123", imageUrl: "url-1", isPrimary: true, displayOrder: 0 },
          { productId: "prod-123", imageUrl: "url-2", isPrimary: false, displayOrder: 1 },
        ],
      });
    });
  });

  describe("setPrimary", () => {
    it("should set image as primary and reset other images of the product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-123" } as any);
      vi.mocked(prisma.productImage.findUnique).mockResolvedValue({
        id: "img-2",
        productId: "prod-123",
      } as any);
      vi.mocked(prisma.productImage.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.productImage.update).mockResolvedValue({ id: "img-2", isPrimary: true } as any);

      const result = await ProductImagesFacade.setPrimary("prod-123", "img-2");

      expect(prisma.productImage.updateMany).toHaveBeenCalledWith({
        where: { productId: "prod-123" },
        data: { isPrimary: false },
      });
      expect(prisma.productImage.update).toHaveBeenCalledWith({
        where: { id: "img-2" },
        data: { isPrimary: true },
      });
      expect(result).toEqual({ id: "img-2", isPrimary: true });
    });

    it("should throw error if image does not belong to the product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-123" } as any);
      vi.mocked(prisma.productImage.findUnique).mockResolvedValue({
        id: "img-2",
        productId: "another-product-id",
      } as any);

      await expect(ProductImagesFacade.setPrimary("prod-123", "img-2")).rejects.toThrow(
        "Image with ID img-2 does not belong to product prod-123."
      );
    });
  });
});
