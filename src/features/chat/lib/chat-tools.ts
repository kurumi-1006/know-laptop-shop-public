import prisma from "@/lib/prisma";
import { dynamicTool } from "ai";
import { z } from "zod";
import { appendAiTrace } from "./ai-trace";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function createSearchProducts(traceId?: string) {
  return dynamicTool({
  description:
    "Search for laptop products matching a keyword (name or description). Optionally filter by brand, category, or price range. Returns matching products with basic info.",
  inputSchema: z.object({
    query: z.string().trim().max(120).optional().default("").describe("Search keyword, model, need or specification"),
    brand: z.string().optional().describe("Filter by brand name (partial match)"),
    category: z.string().optional().describe("Filter by category name (partial match)"),
    minPrice: z.number().min(0).optional().describe("Minimum price in VND"),
    maxPrice: z.number().min(0).optional().describe("Maximum price in VND"),
    limit: z.number().min(1).max(5).optional().default(5).describe("Max results to return"),
  }),
  execute: async (input: unknown): Promise<JsonValue> => {
    try {
      const { query, brand, category, minPrice, maxPrice, limit = 5 } = input as {
        query: string;
        brand?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
      };
      appendAiTrace(traceId ?? "", "tool.searchProducts.input", input);

      const conditions: Record<string, unknown>[] = [
        { isDeleted: false, status: "active", stock: { gt: 0 } },
      ];

      if (query.trim()) {
        conditions.push({
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { brand: { name: { contains: query, mode: "insensitive" } } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            { specs: { some: { value: { contains: query, mode: "insensitive" } } } },
          ],
        });
      }

      if (brand) {
        conditions.push({ brand: { name: { contains: brand, mode: "insensitive" } } });
      }
      if (category) {
        conditions.push({ category: { name: { contains: category, mode: "insensitive" } } });
      }
      if (minPrice !== undefined || maxPrice !== undefined) {
        const range = {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        };
        conditions.push({
          OR: [
            { salePrice: { not: null, ...range } },
            { salePrice: null, price: range },
          ],
        });
      }

      const products = await prisma.product.findMany({
        where: { AND: conditions },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          stock: true,
          brand: { select: { name: true } },
          category: { select: { name: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { imageUrl: true },
          },
          specs: {
            take: 5,
            select: {
              value: true,
              attribute: { select: { name: true } },
            },
          },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      if (products.length === 0) {
        const output = {
          found: false,
          message: `No active products found matching "${query}". Try a broader search.`,
          products: [],
        };
        appendAiTrace(traceId ?? "", "tool.searchProducts.output", output);
        return output;
      }

      const output = {
        found: true,
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          url: `/products/${p.slug}`,
          price: Number(p.price),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          stock: p.stock,
          brand: p.brand.name,
          category: p.category.name,
          image: p.images[0]?.imageUrl ?? null,
          keySpecs: p.specs.map((s) => `${s.attribute.name}: ${s.value}`),
        })),
      };
      appendAiTrace(traceId ?? "", "tool.searchProducts.output", output);
      return output;
    } catch (error) {
      console.error("searchProducts tool error:", error);
      return {
        found: false,
        message: "Unable to search products right now. Please try again.",
        products: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  });
}

function createGetProductDetails(traceId?: string) {
  return dynamicTool({
  description:
    "Get detailed specifications, images, pricing, and available coupons for a specific laptop product by its ID or name slug.",
  inputSchema: z.object({
    productId: z.string().optional().describe("Product ID (CUID string)"),
    productName: z.string().optional().describe("Product name to search (partial match)"),
  }),
  execute: async (input: unknown): Promise<JsonValue> => {
    try {
      const { productId, productName } = input as { productId?: string; productName?: string };
      appendAiTrace(traceId ?? "", "tool.getProductDetails.input", input);

      if (!productId && !productName) {
        return { error: "Provide either productId or productName." };
      }

      const conditions: Record<string, unknown>[] = [
        { isDeleted: false, status: "active", stock: { gt: 0 } },
      ];
      if (productId) {
        conditions.push({ id: productId });
      } else if (productName) {
        conditions.push({ name: { contains: productName, mode: "insensitive" } });
      }

      const product = await prisma.product.findFirst({
        where: { AND: conditions },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          images: { orderBy: { displayOrder: "asc" }, select: { imageUrl: true, isPrimary: true } },
          specs: { include: { attribute: { select: { name: true, groupName: true } } } },
          productCoupons: {
            include: {
              coupon: {
                select: {
                  code: true,
                  name: true,
                  discountType: true,
                  discountValue: true,
                  isActive: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        return {
          found: false,
          message: `Product${productId ? ` with ID ${productId}` : ` matching "${productName}"`} not found.`,
        };
      }

      const output = {
        found: true,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          brand: product.brand.name,
          category: product.category.name,
          price: Number(product.price),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          stock: product.stock,
          status: product.status,
          specs: product.specs.map((s) => ({
            name: s.attribute.name,
            group: s.attribute.groupName ?? "General",
            value: s.value,
          })),
          images: product.images.map((img) => ({
            url: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
          coupons: product.productCoupons
            .filter((pc) => pc.coupon.isActive && new Date(pc.coupon.endDate) > new Date())
            .map((pc) => ({
              code: pc.coupon.code,
              name: pc.coupon.name,
              discountType: pc.coupon.discountType,
              discountValue: Number(pc.coupon.discountValue),
              endDate: pc.coupon.endDate.toISOString(),
          })),
        },
      };
      appendAiTrace(traceId ?? "", "tool.getProductDetails.output", output);
      return output;
    } catch (error) {
      console.error("getProductDetails tool error:", error);
      return {
        found: false,
        message: "Unable to load product details right now.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  });
}

function createCheckStock(traceId?: string) {
  return dynamicTool({
  description:
    "Check stock availability for a laptop product. Returns current stock count and status.",
  inputSchema: z.object({
    productId: z.string().optional().describe("Product ID (CUID string)"),
    productName: z.string().optional().describe("Product name to search (partial match)"),
  }),
  execute: async (input: unknown): Promise<JsonValue> => {
    try {
      const { productId, productName } = input as { productId?: string; productName?: string };
      appendAiTrace(traceId ?? "", "tool.checkStock.input", input);

      if (!productId && !productName) {
        return { error: "Provide either productId or productName." };
      }

      const conditions: Record<string, unknown>[] = [
        { isDeleted: false, status: "active" },
      ];
      if (productId) {
        conditions.push({ id: productId });
      } else if (productName) {
        conditions.push({ name: { contains: productName, mode: "insensitive" } });
      }

      const product = await prisma.product.findFirst({
        where: { AND: conditions },
        select: {
          id: true,
          name: true,
          stock: true,
          status: true,
          price: true,
          salePrice: true,
        },
      });

      if (!product) {
        return {
          found: false,
          message: "Product not found or is not currently active.",
        };
      }

      const stockStatus =
        product.stock === 0 ? "out_of_stock" : product.stock <= 5 ? "low_stock" : "in_stock";

      const statusLabel =
        stockStatus === "out_of_stock"
          ? "Out of stock"
          : stockStatus === "low_stock"
            ? `Low stock (${product.stock} remaining)`
            : `In stock (${product.stock} available)`;

      const output = {
        found: true,
        productId: product.id,
        productName: product.name,
        stock: product.stock,
        status: stockStatus,
        statusLabel,
        price: Number(product.salePrice ?? product.price),
      };
      appendAiTrace(traceId ?? "", "tool.checkStock.output", output);
      return output;
    } catch (error) {
      console.error("checkStock tool error:", error);
      return {
        found: false,
        message: "Unable to check stock right now.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  });
}

export const searchProducts = createSearchProducts();
export const getProductDetails = createGetProductDetails();
export const checkStock = createCheckStock();

export function createChatTools(traceId: string) {
  return {
    searchProducts: createSearchProducts(traceId),
    getProductDetails: createGetProductDetails(traceId),
    checkStock: createCheckStock(traceId),
  } as const;
}

export const chatTools = {
  searchProducts,
  getProductDetails,
  checkStock,
} as const;
