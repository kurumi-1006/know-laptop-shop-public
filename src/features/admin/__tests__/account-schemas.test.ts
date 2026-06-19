import { describe, it, expect } from "vitest";
import {
  createStaffSchema,
  updateAccountSchema,
  accountListQuerySchema,
} from "../schemas/accounts";

describe("Admin Account Schemas", () => {
  describe("createStaffSchema", () => {
    it("chấp nhận dữ liệu nhân viên hợp lệ", () => {
      const result = createStaffSchema.safeParse({
        name: "Nguyễn Văn A",
        email: "nva@example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {

        expect(result.data.email).toBe("nva@example.com");
      }
    });

    it("tự động chuyển email thành lowercase", () => {
      const result = createStaffSchema.safeParse({
        name: "Nguyễn Văn A",
        email: "NVA@Example.COM",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("nva@example.com");
      }
    });

    it("từ chối tên dưới 2 ký tự", () => {
      const result = createStaffSchema.safeParse({
        name: "A",
        email: "a@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối tên trên 100 ký tự", () => {
      const result = createStaffSchema.safeParse({
        name: "A".repeat(101),
        email: "a@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối email không hợp lệ", () => {
      const result = createStaffSchema.safeParse({
        name: "Nguyễn Văn A",
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối thiếu tên", () => {
      const result = createStaffSchema.safeParse({
        email: "a@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("từ chối thiếu email", () => {
      const result = createStaffSchema.safeParse({
        name: "Nguyễn Văn A",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateAccountSchema", () => {

    it("chấp nhận action set-role với role customer", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-role",
        role: "customer",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận action set-role với role staff", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-role",
        role: "staff",
      });
      expect(result.success).toBe(true);
    });

    it("từ chối action set-role với role không hợp lệ", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-role",
        role: "admin",
      });
      expect(result.success).toBe(false);
    });


    it("chấp nhận action set-ban với banned = true", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-ban",
        banned: true,
        reason: "Vi phạm quy định",
      });
      expect(result.success).toBe(true);
    });

    it("chấp nhận action set-ban với banned = false (mở khóa)", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-ban",
        banned: false,
      });
      expect(result.success).toBe(true);
    });

    it("từ chối lý do khóa quá dài (>200 ký tự)", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-ban",
        banned: true,
        reason: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("chấp nhận action set-ban với banExpires", () => {
      const result = updateAccountSchema.safeParse({
        action: "set-ban",
        banned: true,
        banExpires: "2026-12-31T23:59:59.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("từ chối action không hợp lệ", () => {
      const result = updateAccountSchema.safeParse({
        action: "delete",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("accountListQuerySchema", () => {
    it("sử dụng giá trị mặc định khi không truyền tham số", () => {
      const result = accountListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kind).toBe("customer");
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
        expect(result.data.search).toBe("");
        expect(result.data.status).toBe("all");
      }
    });

    it("chấp nhận kind = customer hoặc staff", () => {
      for (const kind of ["customer", "staff"] as const) {
        const result = accountListQuerySchema.safeParse({ kind });
        expect(result.success).toBe(true);
      }
    });

    it("từ chối kind không hợp lệ", () => {
      const result = accountListQuerySchema.safeParse({ kind: "admin" });
      expect(result.success).toBe(false);
    });

    it("chấp nhận status all/active/banned", () => {
      for (const status of ["all", "active", "banned"] as const) {
        const result = accountListQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("từ chối pageSize dưới 5", () => {
      const result = accountListQuerySchema.safeParse({ pageSize: 2 });
      expect(result.success).toBe(false);
    });

    it("từ chối pageSize trên 50", () => {
      const result = accountListQuerySchema.safeParse({ pageSize: 100 });
      expect(result.success).toBe(false);
    });

    it("chấp nhận search tối đa 100 ký tự", () => {
      const result = accountListQuerySchema.safeParse({
        search: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("từ chối search trên 100 ký tự", () => {
      const result = accountListQuerySchema.safeParse({
        search: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });
});
