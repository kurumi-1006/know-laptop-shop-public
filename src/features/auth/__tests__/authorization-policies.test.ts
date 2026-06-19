import { describe, it, expect } from "vitest";
import { isAdmin, isStaff, hasRole } from "@/lib/roles";










function authenticationPolicy(session: { user: { role: string } } | null): "allow" | "redirect-login" {
  if (session) return "allow";
  return "redirect-login";
}

function dashboardPolicy(
  pathname: string,
  session: { user: { role: string } } | null
): "allow" | "redirect-home" {
  if (pathname.startsWith("/dashboard") && session?.user.role === "customer") {
    return "redirect-home";
  }
  return "allow";
}

function customerAreaPolicy(
  pathname: string,
  session: { user: { role: string } } | null
): "allow" | "redirect-dashboard" {
  const customerRoutes = ["/profile", "/address", "/cart", "/wishlist", "/checkout", "/orders"];
  if (customerRoutes.some((r) => pathname.startsWith(r)) && session?.user.role !== "customer") {
    return "redirect-dashboard";
  }
  return "allow";
}

describe("Authorization Policies (Kiểm thử logic phân quyền)", () => {
  describe("Authentication Policy (Chính sách xác thực)", () => {
    it("IT-01: cho phép truy cập nếu đã có session", () => {
      const session = { user: { role: "customer" } };
      expect(authenticationPolicy(session)).toBe("allow");
    });

    it("chuyển hướng về login nếu chưa có session", () => {
      expect(authenticationPolicy(null)).toBe("redirect-login");
    });
  });

  describe("Dashboard Policy (Chính sách khu vực quản trị)", () => {
    it("IT-10: chặn customer truy cập /dashboard", () => {
      const session = { user: { role: "customer" } };
      expect(dashboardPolicy("/dashboard", session)).toBe("redirect-home");
    });

    it("chặn customer truy cập /dashboard/users", () => {
      const session = { user: { role: "customer" } };
      expect(dashboardPolicy("/dashboard/users", session)).toBe("redirect-home");
    });

    it("chặn customer truy cập /dashboard/staff", () => {
      const session = { user: { role: "customer" } };
      expect(dashboardPolicy("/dashboard/staff", session)).toBe("redirect-home");
    });

    it("IT-02: cho phép staff truy cập dashboard", () => {
      const session = { user: { role: "staff" } };
      expect(dashboardPolicy("/dashboard", session)).toBe("allow");
    });

    it("IT-03: cho phép admin truy cập dashboard", () => {
      const session = { user: { role: "admin" } };
      expect(dashboardPolicy("/dashboard", session)).toBe("allow");
    });

    it("không ảnh hưởng đến trang thường", () => {
      const session = { user: { role: "customer" } };
      expect(dashboardPolicy("/products", session)).toBe("allow");
    });
  });

  describe("Customer Area Policy (Chính sách khu vực khách hàng)", () => {
    it("FT-34: chặn staff truy cập /profile", () => {
      const session = { user: { role: "staff" } };
      expect(customerAreaPolicy("/profile", session)).toBe("redirect-dashboard");
    });

    it("chặn admin truy cập /address", () => {
      const session = { user: { role: "admin" } };
      expect(customerAreaPolicy("/address", session)).toBe("redirect-dashboard");
    });

    it("chặn staff truy cập /cart", () => {
      const session = { user: { role: "staff" } };
      expect(customerAreaPolicy("/cart", session)).toBe("redirect-dashboard");
    });

    it("chặn admin truy cập /checkout", () => {
      const session = { user: { role: "admin" } };
      expect(customerAreaPolicy("/checkout", session)).toBe("redirect-dashboard");
    });

    it("cho phép customer truy cập /profile", () => {
      const session = { user: { role: "customer" } };
      expect(customerAreaPolicy("/profile", session)).toBe("allow");
    });

    it("cho phép customer truy cập /address", () => {
      const session = { user: { role: "customer" } };
      expect(customerAreaPolicy("/address", session)).toBe("allow");
    });

    it("cho phép customer truy cập /cart", () => {
      const session = { user: { role: "customer" } };
      expect(customerAreaPolicy("/cart", session)).toBe("allow");
    });
  });

  describe("Chain of Responsibility (Chuỗi chính sách)", () => {
    function fullPolicyChain(
      pathname: string,
      session: { user: { role: string } } | null
    ): string {
      const auth = authenticationPolicy(session);
      if (auth !== "allow") return auth;

      const dashboard = dashboardPolicy(pathname, session);
      if (dashboard !== "allow") return dashboard;

      const customer = customerAreaPolicy(pathname, session);
      if (customer !== "allow") return customer;

      return "allow";
    }

    it("customer truy cập /profile -> allow", () => {
      expect(fullPolicyChain("/profile", { user: { role: "customer" } })).toBe("allow");
    });

    it("customer truy cập /dashboard -> redirect-home", () => {
      expect(fullPolicyChain("/dashboard", { user: { role: "customer" } })).toBe("redirect-home");
    });

    it("staff truy cập /profile -> redirect-dashboard", () => {
      expect(fullPolicyChain("/profile", { user: { role: "staff" } })).toBe("redirect-dashboard");
    });

    it("staff truy cập /dashboard -> allow", () => {
      expect(fullPolicyChain("/dashboard", { user: { role: "staff" } })).toBe("allow");
    });

    it("admin truy cập /dashboard/users -> allow", () => {
      expect(fullPolicyChain("/dashboard/users", { user: { role: "admin" } })).toBe("allow");
    });

    it("chưa đăng nhập -> redirect-login", () => {
      expect(fullPolicyChain("/profile", null)).toBe("redirect-login");
    });

    it("chưa đăng nhập truy cập /login -> redirect-login (auth route cần xử lý riêng)", () => {


      expect(fullPolicyChain("/login", null)).toBe("redirect-login");
    });
  });

  describe("Role-based Access Control (Kiểm soát theo vai trò)", () => {

    it("UT-03: isStaff(customer) = false", () => {
      expect(isStaff("customer")).toBe(false);
    });


    it("UT-04: isStaff(staff) = true", () => {
      expect(isStaff("staff")).toBe(true);
    });

    it("isStaff(admin) = true", () => {
      expect(isStaff("admin")).toBe(true);
    });


    it("UT-05: isAdmin(admin) = true", () => {
      expect(isAdmin("admin")).toBe(true);
    });

    it("isAdmin(staff) = false", () => {
      expect(isAdmin("staff")).toBe(false);
    });

    it("isAdmin(customer) = false", () => {
      expect(isAdmin("customer")).toBe(false);
    });

    it("isAdmin(null) = false", () => {
      expect(isAdmin(null)).toBe(false);
    });
  });
});
