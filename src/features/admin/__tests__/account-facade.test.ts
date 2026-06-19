import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    orders: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));


import prisma from "@/lib/prisma";
import {
  AccountManagementFacade,
  AccountAccessError,
} from "../lib/account-facade";

describe("AccountManagementFacade", () => {
  let facade: AccountManagementFacade;
  const adminActor = { id: "admin-1", role: "admin" };
  const staffActor = { id: "staff-1", role: "staff" };
  const customerActor = { id: "cust-1", role: "customer" };

  beforeEach(() => {
    facade = new AccountManagementFacade();
    vi.clearAllMocks();
  });

  describe("list - Danh sách tài khoản", () => {
    it("ném lỗi 403 nếu actor là customer", async () => {
      try {
        await facade.list(customerActor, {});
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(403);
      }
    });

    it("ném lỗi 403 nếu actor là null", async () => {
      try {
        await facade.list(null, {});
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(403);
      }
    });

    it("cho phép staff xem danh sách customer", async () => {
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([
        [], 0, 0, 0, 0, 0,
      ]);
      await expect(
        facade.list(staffActor, { kind: "customer" })
      ).resolves.toBeDefined();
    });

    it("ném lỗi 403 nếu staff xem danh sách staff", async () => {
      try {
        await facade.list(staffActor, { kind: "staff" });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).message).toBe(
          "Yêu cầu quyền quản trị."
        );
      }
    });

    it("cho phép admin xem danh sách staff", async () => {
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([
        [], 0, 0, 0, 0, 0,
      ]);
      await expect(
        facade.list(adminActor, { kind: "staff" })
      ).resolves.toBeDefined();
    });

    it("ném lỗi 400 khi query không hợp lệ", async () => {
      try {
        await facade.list(staffActor, { kind: "invalid" });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(400);
      }
    });
  });

  describe("createStaff - Tạo nhân viên", () => {
    it("ném lỗi 403 khi staff cố gắng tạo nhân viên", async () => {
      try {
        await facade.createStaff(staffActor, {
          name: "Test",
          email: "test@test.com",
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(403);
      }
    });

    it("ném lỗi 400 khi dữ liệu không hợp lệ", async () => {
      try {
        await facade.createStaff(adminActor, { name: "T" });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(400);
      }
    });

    it("ném lỗi 409 khi email thuộc về customer", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "customer",
      });

      try {
        await facade.createStaff(adminActor, {
          name: "Test User",
          email: "customer@test.com",
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(409);
        expect((error as AccountAccessError).message).toBe(
          "Email này thuộc về khách hàng. Hãy nâng cấp tài khoản."
        );
      }
    });

    it("ném lỗi 409 khi email đã tồn tại với staff", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "staff",
      });

      try {
        await facade.createStaff(adminActor, {
          name: "Test User",
          email: "staff@test.com",
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(409);
        expect((error as AccountAccessError).message).toBe(
          "Nhân viên với email này đã tồn tại."
        );
      }
    });

    it("tạo staff thành công với dữ liệu hợp lệ", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );
      (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "new-staff",
        name: "Test User",
        email: "new@test.com",
        role: "staff",
        createdAt: new Date(),
      });

      const result = await facade.createStaff(adminActor, {
        name: "Test User",
        email: "new@test.com",
      });

      expect(result).toBeDefined();
      expect(result.email).toBe("new@test.com");
      expect(result.role).toBe("staff");
    });
  });

  describe("getDetail - Chi tiết tài khoản", () => {
    it("ném lỗi 403 nếu actor không phải staff/admin", async () => {
      try {
        await facade.getDetail(customerActor, "user-1");
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(403);
      }
    });

    it("ném lỗi 404 nếu user không tồn tại", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );

      try {
        await facade.getDetail(staffActor, "non-existent");
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(404);
      }
    });
  });

  describe("updateAccount - Cập nhật tài khoản", () => {
    it("ném lỗi 403 nếu actor là null", async () => {
      try {
        await facade.updateAccount(null, "target-1", {
          action: "set-ban",
          banned: true,
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(403);
      }
    });

    it("ném lỗi 400 khi admin cố tự khóa chính mình", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "admin-1",
        role: "admin",
        banned: false,
      });

      try {
        await facade.updateAccount(adminActor, "admin-1", {
          action: "set-ban",
          banned: true,
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(400);
        expect((error as AccountAccessError).message).toContain("chính mình");
      }
    });

    it("ném lỗi 403 khi cố khóa tài khoản admin khác", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "admin-2",
        role: "admin",
        banned: false,
      });

      try {
        await facade.updateAccount(adminActor, "admin-2", {
          action: "set-ban",
          banned: true,
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(403);
        expect((error as AccountAccessError).message).toBe(
          "Tài khoản quản trị viên không thể được quản lý tại đây."
        );
      }
    });

    it("cho phép admin khóa tài khoản customer", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "cust-1",
        role: "customer",
        banned: false,
      });
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: Function) => fn(prisma)
      );
      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "cust-1",
        banned: true,
        banReason: "Vi phạm",
      });
      (prisma.session.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
        count: 1,
      });
      (prisma.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await facade.updateAccount(adminActor, "cust-1", {
        action: "set-ban",
        banned: true,
        reason: "Vi phạm",
      });

      expect(result).toBeDefined();
    });

    it("cho phép admin mở khóa tài khoản customer", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "cust-1",
        role: "customer",
        banned: true,
      });
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: Function) => fn(prisma)
      );
      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "cust-1",
        banned: false,
        banReason: null,
      });

      const result = await facade.updateAccount(adminActor, "cust-1", {
        action: "set-ban",
        banned: false,
      });

      expect(result).toBeDefined();
    });

    it("ném lỗi 400 khi action không hợp lệ", async () => {
      try {
        await facade.updateAccount(adminActor, "target-1", {
          action: "invalid",
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(400);
      }
    });

    it("ném lỗi 404 khi user mục tiêu không tồn tại", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );

      try {
        await facade.updateAccount(adminActor, "non-existent", {
          action: "set-ban",
          banned: true,
        });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(AccountAccessError);
        expect((error as AccountAccessError).status).toBe(404);
      }
    });
  });

  describe("AccountAccessError", () => {
    it("tạo lỗi với message và status", () => {
      const error = new AccountAccessError("Test error", 403);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(403);
    });

    it("tạo lỗi với details", () => {
      const error = new AccountAccessError("Test error", 400, {
        field: "email",
      });
      expect(error.details).toEqual({ field: "email" });
    });
  });
});
