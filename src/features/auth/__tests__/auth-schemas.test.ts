import { describe, it, expect } from "vitest";
import { emailSignInSchema, otpSchema } from "../schemas/auth";

describe("Auth Schemas", () => {
  describe("emailSignInSchema", () => {

    it("UT-01: chấp nhận email hợp lệ", () => {
      const result = emailSignInSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(true);
    });

    it("chấp nhận email có dấu chấm và dấu cộng", () => {
      const result = emailSignInSchema.safeParse({
        email: "user.name+tag@example.co.uk",
      });
      expect(result.success).toBe(true);
    });

    it("từ chối email thiếu @", () => {
      const result = emailSignInSchema.safeParse({
        email: "userexample.com",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Nhập địa chỉ email hợp lệ."
        );
      }
    });

    it("từ chối email thiếu tên miền", () => {
      const result = emailSignInSchema.safeParse({ email: "user@" });
      expect(result.success).toBe(false);
    });

    it("từ chối email trống", () => {
      const result = emailSignInSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });

    it("từ chối input thiếu trường email", () => {
      const result = emailSignInSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("otpSchema", () => {
    it("chấp nhận OTP 6 chữ số hợp lệ", () => {
      const result = otpSchema.safeParse({ otp: "123456" });
      expect(result.success).toBe(true);
    });

    it("từ chối OTP dưới 6 chữ số", () => {
      const result = otpSchema.safeParse({ otp: "12345" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Nhập mã xác minh 6 chữ số."
        );
      }
    });

    it("từ chối OTP trên 6 chữ số", () => {
      const result = otpSchema.safeParse({ otp: "1234567" });
      expect(result.success).toBe(false);
    });

    it("từ chối OTP chứa chữ cái", () => {
      const result = otpSchema.safeParse({ otp: "abc123" });
      expect(result.success).toBe(false);
    });

    it("từ chối OTP trống", () => {
      const result = otpSchema.safeParse({ otp: "" });
      expect(result.success).toBe(false);
    });
  });
});
