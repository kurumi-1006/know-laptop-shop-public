import { describe, it, expect } from "vitest";
import { isAdmin, isStaff, hasRole, getUserRoles } from "@/lib/roles";
import { UserRole } from "@/app/generated/prisma/enums";

describe("Auth Permissions (Phân quyền)", () => {
  describe("isStaff", () => {

    it("UT-04: trả về true cho vai trò staff", () => {
      expect(isStaff(UserRole.staff)).toBe(true);
    });

    it("trả về true cho vai trò admin", () => {
      expect(isStaff(UserRole.admin)).toBe(true);
    });


    it("UT-03: trả về false cho vai trò customer", () => {
      expect(isStaff(UserRole.customer)).toBe(false);
    });

    it("trả về false cho null/undefined", () => {
      expect(isStaff(null)).toBe(false);
      expect(isStaff(undefined)).toBe(false);
    });
  });

  describe("isAdmin", () => {

    it("UT-05: trả về true cho vai trò admin", () => {
      expect(isAdmin(UserRole.admin)).toBe(true);
    });

    it("trả về false cho vai trò staff", () => {
      expect(isAdmin(UserRole.staff)).toBe(false);
    });

    it("trả về false cho vai trò customer", () => {
      expect(isAdmin(UserRole.customer)).toBe(false);
    });

    it("trả về false cho null/undefined", () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("trả về true khi vai trò người dùng nằm trong danh sách cho phép", () => {
      expect(hasRole(UserRole.staff, [UserRole.staff, UserRole.admin])).toBe(
        true
      );
    });

    it("trả về false khi vai trò người dùng không nằm trong danh sách cho phép", () => {
      expect(hasRole(UserRole.customer, [UserRole.staff, UserRole.admin])).toBe(
        false
      );
    });

    it("trả về false khi role là null", () => {
      expect(hasRole(null, [UserRole.admin])).toBe(false);
    });
  });

  describe("getUserRoles", () => {
    it("trả về customer cho role null/undefined", () => {
      expect(getUserRoles(null)).toEqual([UserRole.customer]);
      expect(getUserRoles(undefined)).toEqual([UserRole.customer]);
    });

    it("trả về customer cho role rỗng", () => {
      expect(getUserRoles("")).toEqual([UserRole.customer]);
    });

    it("trả về đúng role cho role hợp lệ", () => {
      expect(getUserRoles(UserRole.admin)).toEqual([UserRole.admin]);
    });
  });
});
