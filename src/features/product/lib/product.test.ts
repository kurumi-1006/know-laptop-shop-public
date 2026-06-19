import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const localMockTx = {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
  };
  return {
    default: {
      ...localMockTx,
      $transaction: vi.fn((callback) => callback(localMockTx)),
    },
  };
});

import prisma from "@/lib/prisma";
import { ProductRepository } from "./product";

describe("ProductRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findMany", () => {
    it("builds correct Prisma filter query for search and specs combination", async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      await ProductRepository.findMany(
        {
          search: "gaming",
          minPrice: 10000000,
          maxPrice: 20000000,
          ram: "16GB",
        },
        { page: 1, pageSize: 10 }
      );

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { isDeleted: false },
              {
                OR: [
                  { name: { contains: "gaming", mode: "insensitive" } },
                  { description: { contains: "gaming", mode: "insensitive" } },
                  { brand: { name: { contains: "gaming", mode: "insensitive" } } },
                  {
                    specs: {
                      some: {
                        value: { contains: "gaming", mode: "insensitive" },
                      },
                    },
                  },
                ],
              },
              {
                OR: [
                  {
                    salePrice: null,
                    price: { gte: 10000000, lte: 20000000 },
                  },
                  {
                    salePrice: { not: null, gte: 10000000, lte: 20000000 },
                  },
                ],
              },
              {
                specs: {
                  some: {
                    attribute: { name: { contains: "Memory", mode: "insensitive" } },
                    value: { contains: "16GB", mode: "insensitive" },
                  },
                },
              },
            ],
          },
          skip: 0,
          take: 10,
        })
      );
    });
  });

  describe("createWithDetails", () => {
    it("handles transactional product creation with specs and images", async () => {
      (prisma.product.create as any).mockResolvedValue({ id: "prod-123" });
      (prisma.specAttribute.findFirst as any).mockResolvedValue(null);
      (prisma.specAttribute.create as any).mockResolvedValue({ id: "attr-cpu" });
      (prisma.product.findUniqueOrThrow as any).mockResolvedValue({ id: "prod-123" });

      const input = {
        name: "Zenbook 14",
        slug: "zenbook-14",
        price: 25000000,
        stock: 10,
        categoryId: "cat-1",
        brandId: "brand-1",
        specs: [{ name: "Processor", groupName: "CPU", value: "Core Ultra 7" }],
        images: [{ imageUrl: "https://url.com/img.jpg", isPrimary: true }],
      };

      const result = await ProductRepository.createWithDetails(input);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: "Zenbook 14",
          slug: "zenbook-14",
          price: 25000000,
          stock: 10,
          categoryId: "cat-1",
          brandId: "brand-1",
        },
      });

      expect(prisma.specAttribute.findFirst).toHaveBeenCalledWith({
        where: { name: "Processor", groupName: "CPU" },
      });

      expect(prisma.specAttribute.create).toHaveBeenCalledWith({
        data: { name: "Processor", groupName: "CPU" },
      });

      expect(prisma.productSpec.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-123",
          attributeId: "attr-cpu",
          value: "Core Ultra 7",
        },
      });

      expect(prisma.productImage.createMany).toHaveBeenCalledWith({
        data: [
          {
            productId: "prod-123",
            imageUrl: "https://url.com/img.jpg",
            isPrimary: true,
            displayOrder: 0,
          },
        ],
      });

      expect(result).toEqual({ id: "prod-123" });
    });
  });

  describe("softDelete", () => {
    it("performs update of isDeleted flag", async () => {
      (prisma.product.update as any).mockResolvedValue({ id: "prod-1", isDeleted: true });

      const result = await ProductRepository.softDelete("prod-1");

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { isDeleted: true },
      });
      expect(result.isDeleted).toBe(true);
    });
  });
});
