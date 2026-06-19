import { z } from "zod";
import { DiscountType, ProductStatus } from "@/app/generated/prisma/client";

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(100).default(""),
  status: z.string().default("all"),
  categoryId: z.string().default("all"),
  brandId: z.string().default("all"),
  sortBy: z.enum(["createdAt", "name", "price", "stock"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Tên sản phẩm không được để trống").max(200),
  description: z.string().trim().max(5000).default(""),
  price: z.number().positive("Giá sản phẩm phải lớn hơn 0"),
  salePrice: z.number().positive("Giá khuyến mãi phải lớn hơn 0").nullable().optional(),
  stock: z.number().int().min(0, "Số lượng tồn kho không được âm").default(0),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.active),
  categoryId: z.number().int().positive("Danh mục không hợp lệ"),
  brandId: z.number().int().positive("Thương hiệu không hợp lệ"),
}).refine(
  (data) => !data.salePrice || data.salePrice < data.price,
  { message: "Giá khuyến mãi phải nhỏ hơn giá gốc", path: ["salePrice"] }
);

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, "Tên sản phẩm không được để trống").max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  price: z.number().positive("Giá sản phẩm phải lớn hơn 0").optional(),
  salePrice: z.number().positive("Giá khuyến mãi phải lớn hơn 0").nullable().optional(),
  stock: z.number().int().min(0).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  categoryId: z.number().int().positive().optional(),
  brandId: z.number().int().positive().optional(),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;
