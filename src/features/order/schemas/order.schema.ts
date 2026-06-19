import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().optional(),
  couponCode: z.string().optional(),
  note: z.string().optional(),
  paymentMethod: z.enum(["cod", "stripe"]).default("cod"),
  selectedProductIds: z.array(z.string()).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
