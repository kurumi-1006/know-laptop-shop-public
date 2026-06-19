import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileFacade, ProfileAccessError } from "../lib/profile-facade";
import { isStaff } from "@/lib/roles";


vi.mock("@/lib/prisma", () => ({
  default: {
    profile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    address: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("ProfileFacade", () => {
  let facade: ProfileFacade;

  beforeEach(() => {
    facade = new ProfileFacade();
  });

  describe("assertCustomer", () => {

    it("cho phép customer truy cập", () => {
      expect(() =>
        facade.assertCustomer({ id: "1", role: "customer" })
      ).not.toThrow();
    });

    it("ném lỗi 401 khi user là null", () => {
      try {
        facade.assertCustomer(null);
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(ProfileAccessError);
        expect((error as ProfileAccessError).message).toBe("Unauthorized");
        expect((error as ProfileAccessError).status).toBe(401);
      }
    });

    it("ném lỗi 401 khi user là undefined", () => {
      try {
        facade.assertCustomer(undefined);
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(ProfileAccessError);
        expect((error as ProfileAccessError).status).toBe(401);
      }
    });

    it("ném lỗi 403 khi user là staff", () => {
      try {
        facade.assertCustomer({ id: "2", role: "staff" });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(ProfileAccessError);
        expect((error as ProfileAccessError).message).toBe(
          "Customer access only."
        );
        expect((error as ProfileAccessError).status).toBe(403);
      }
    });

    it("ném lỗi 403 khi user là admin", () => {
      try {
        facade.assertCustomer({ id: "3", role: "admin" });
        expect.fail("Phải ném lỗi");
      } catch (error) {
        expect(error).toBeInstanceOf(ProfileAccessError);
        expect((error as ProfileAccessError).message).toBe(
          "Customer access only."
        );
        expect((error as ProfileAccessError).status).toBe(403);
      }
    });

    it("ném lỗi 403 khi role là chuỗi rỗng", () => {


      expect(() => facade.assertCustomer({ id: "4", role: "" })).not.toThrow();
    });
  });

  describe("ProfileAccessError", () => {
    it("tạo lỗi với message và status", () => {
      const error = new ProfileAccessError("Test error", 400);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
    });

    it("tạo lỗi với details", () => {
      const error = new ProfileAccessError("Test error", 400, {
        field: "phone",
      });
      expect(error.details).toEqual({ field: "phone" });
    });
  });
});
