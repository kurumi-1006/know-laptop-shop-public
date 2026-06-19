import { z } from "zod";

export const accountKindSchema = z.enum(["customer", "staff"]);

export const accountListQuerySchema = z.object({
  kind: accountKindSchema.default("customer"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(100).default(""),
  status: z.enum(["all", "active", "banned"]).default("all"),
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập tên.").max(100),
  email: z.email("Nhập địa chỉ email hợp lệ.").transform((email) =>
    email.trim().toLowerCase(),
  ),
});

export const updateAccountSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set-role"),
    role: z.enum(["customer", "staff"]),
  }),
  z.object({
    action: z.literal("set-ban"),
    banned: z.boolean(),
    reason: z.string().trim().max(200).optional(),
    banExpires: z.string().datetime().optional().nullable(),
  }),
]);

export type AccountKind = z.infer<typeof accountKindSchema>;
export type CreateStaffValues = z.input<typeof createStaffSchema>;
export type UpdateAccountValues = z.infer<typeof updateAccountSchema>;
