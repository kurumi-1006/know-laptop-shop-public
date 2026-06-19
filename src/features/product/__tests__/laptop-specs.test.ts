import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    product: {
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    specAttribute: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    productSpec: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    productImage: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    default: mockPrisma,
  };
});

import prisma from "@/lib/prisma";
import { ProductRepository } from "../lib/product";
import { ProductStatus } from "@/app/generated/prisma/client";

describe("LaptopSpec (ProductSpec & SpecAttribute)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: Function) => fn(prisma)
    );
  });

  describe("ProductRepository.createWithDetails", () => {
    it("should successfully create a product with specs and default group to General if not provided", async () => {
      const mockProduct = {
        id: "prod-123",
        name: "Test Laptop",
        slug: "test-laptop",
        price: 15000000,
        salePrice: null,
        stock: 10,
        status: ProductStatus.active,
        categoryId: "cat-1",
        brandId: "brand-1",
      };

      const mockSpecAttribute = {
        id: "attr-1",
        name: "RAM",
        groupName: "General",
      };

      const mockProductSpec = {
        id: "spec-1",
        productId: "prod-123",
        attributeId: "attr-1",
        value: "16GB",
      };

      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.specAttribute.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.specAttribute.create).mockResolvedValue(mockSpecAttribute as any);
      vi.mocked(prisma.productSpec.create).mockResolvedValue(mockProductSpec as any);
      vi.mocked(prisma.product.findUniqueOrThrow).mockResolvedValue({
        ...mockProduct,
        specs: [{ ...mockProductSpec, attribute: mockSpecAttribute }],
        images: [],
      } as any);

      const input = {
        name: "Test Laptop",
        slug: "test-laptop",
        price: 15000000,
        stock: 10,
        categoryId: "cat-1",
        brandId: "brand-1",
        specs: [
          { name: "RAM", value: "16GB" }
        ]
      };

      const result = await ProductRepository.createWithDetails(input);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: "Test Laptop",
          slug: "test-laptop",
          price: 15000000,
          stock: 10,
          categoryId: "cat-1",
          brandId: "brand-1",
        }
      });

      expect(prisma.specAttribute.findFirst).toHaveBeenCalledWith({
        where: {
          name: "RAM",
          groupName: "General"
        }
      });

      expect(prisma.specAttribute.create).toHaveBeenCalledWith({
        data: {
          name: "RAM",
          groupName: "General"
        }
      });

      expect(prisma.productSpec.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-123",
          attributeId: "attr-1",
          value: "16GB"
        }
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("prod-123");
      expect(result.specs[0].value).toBe("16GB");
      expect(result.specs[0].attribute.groupName).toBe("General");
    });
  });

  describe("ProductRepository.update specs", () => {
    it("should delete old specs and recreate new specs when updating", async () => {
      const mockProduct = {
        id: "prod-123",
        name: "Updated Laptop",
        price: 16000000,
        stock: 8,
        categoryId: "cat-1",
        brandId: "brand-1",
      };

      const mockSpecAttribute = {
        id: "attr-2",
        name: "CPU",
        groupName: "Performance",
      };

      vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.productSpec.deleteMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.specAttribute.findFirst).mockResolvedValue(mockSpecAttribute as any);
      vi.mocked(prisma.productSpec.create).mockResolvedValue({} as any);

      const input = {
        name: "Updated Laptop",
        price: 16000000,
        stock: 8,
        categoryId: "cat-1",
        brandId: "brand-1",
        specs: [
          { name: "CPU", groupName: "Performance", value: "Core i7" }
        ]
      };

      const result = await ProductRepository.update("prod-123", input);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-123" },
        data: {
          name: "Updated Laptop",
          price: 16000000,
          stock: 8,
          categoryId: "cat-1",
          brandId: "brand-1",
        }
      });

      expect(prisma.productSpec.deleteMany).toHaveBeenCalledWith({
        where: { productId: "prod-123" }
      });

      expect(prisma.specAttribute.findFirst).toHaveBeenCalledWith({
        where: { name: "CPU" }
      });

      expect(prisma.productSpec.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-123",
          attributeId: "attr-2",
          value: "Core i7"
        }
      });

      expect(result).toEqual(mockProduct);
    });
  });
});
