import { z } from "zod";

export const brandQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((val) => val === "true" || (val === "false" ? false : undefined), z.boolean().optional()),
  page: z.preprocess((val) => Number(val || 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess((val) => Number(val || 10), z.number().int().min(1).max(100).default(10)),
});

export const createBrandSchema = z.object({
  name: z.string().trim().min(2, "Tên thương hiệu ít nhất 2 ký tự").max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug không hợp lệ"),
  description: z.string().trim().max(500).optional().nullable(),
  logo: z.string().url("Đường dẫn logo không hợp lệ").optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();
