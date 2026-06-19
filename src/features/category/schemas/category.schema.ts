import { z } from "zod";

export const categoryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((val) => val === "true" || (val === "false" ? false : undefined), z.boolean().optional()),
  parentId: z.string().optional(),
  page: z.preprocess((val) => Number(val || 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess((val) => Number(val || 10), z.number().int().min(1).max(100).default(10)),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục ít nhất 2 ký tự").max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug không hợp lệ"),
  description: z.string().trim().max(500).optional().nullable(),
  image: z.string().url("Đường dẫn ảnh không hợp lệ").optional().nullable().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
