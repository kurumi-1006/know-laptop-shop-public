import { z } from "zod";

export const emailSignInSchema = z.object({
  email: z.email("Nhập địa chỉ email hợp lệ."),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Nhập mã xác minh 6 chữ số."),
});

export type EmailSignInValues = z.infer<typeof emailSignInSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
