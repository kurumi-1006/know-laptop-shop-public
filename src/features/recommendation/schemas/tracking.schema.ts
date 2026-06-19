import { z } from "zod";

export const productViewSchema = z.object({
  productId: z.string().trim().min(1).max(100),
});

export const searchHistorySchema = z.object({
  keyword: z.string().trim().min(1).max(120),
});
