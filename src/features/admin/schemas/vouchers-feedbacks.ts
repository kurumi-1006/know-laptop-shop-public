import { z } from "zod";
import { DiscountType } from "@/app/generated/prisma/client";

export const voucherListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(100).default(""),
});

export const createVoucherSchema = z.object({
  code: z.string().trim().min(1, "Mã voucher không được để trống").max(20),
  name: z.string().trim().max(100).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive("Giá trị giảm giá phải lớn hơn 0"),
  startDate: z.string().refine((v) => !isNaN(new Date(v).getTime()), "Ngày hiệu lực không hợp lệ"),
  endDate: z.string().refine((v) => !isNaN(new Date(v).getTime()), "Ngày kết thúc không hợp lệ"),
  minOrderValue: z.number().min(0).default(0),
  maxDiscountValue: z.number().positive().nullable().optional(),
  quantity: z.number().int().positive("Số lượng sử dụng phải lớn hơn 0"),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.discountType !== DiscountType.percent || data.discountValue <= 100,
  { message: "Phần trăm giảm giá tối đa là 100%", path: ["discountValue"] }
).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: "Ngày kết thúc phải lớn hơn ngày bắt đầu", path: ["endDate"] }
);

export const updateVoucherSchema = z.object({
  code: z.string().trim().min(1).max(20).optional(),
  name: z.string().trim().max(100).optional(),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountValue: z.number().positive().optional(),
  startDate: z.string().refine((v) => !isNaN(new Date(v).getTime()), "Ngày hiệu lực không hợp lệ").optional(),
  endDate: z.string().refine((v) => !isNaN(new Date(v).getTime()), "Ngày kết thúc không hợp lệ").optional(),
  minOrderValue: z.number().min(0).optional(),
  maxDiscountValue: z.number().positive().nullable().optional(),
  quantity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const feedbackListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(100).default(""),
  rating: z.string().default("all"),
  status: z.enum(["all", "visible", "hidden"]).default("all"),
});

export const feedbackVisibilitySchema = z.object({
  feedbackId: z.number().int().positive("ID phản hồi không hợp lệ"),
  isVisible: z.boolean(),
});

export type VoucherListQuery = z.infer<typeof voucherListQuerySchema>;
export type CreateVoucherInput = z.input<typeof createVoucherSchema>;
export type UpdateVoucherInput = z.input<typeof updateVoucherSchema>;
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;
