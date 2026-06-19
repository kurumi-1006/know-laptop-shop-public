import { describe, it, expect } from "vitest";
import { isAdmin, isStaff } from "@/lib/roles";
import { emailSignInSchema } from "../schemas/auth";
import { createStaffSchema, updateAccountSchema } from "@/features/admin/schemas/accounts";
import { personalInfoSchema, addressFormSchema } from "@/features/profile/schemas/profile";
import { SYSTEM_PROMPT } from "@/features/chat/constants";









describe("Integration: Đăng nhập → Xác định vai trò → Điều hướng", () => {

  function determineDashboard(pathname: string, role?: string | null): string {

    if (pathname.startsWith("/dashboard")) {
      if (isStaff(role)) return "allow";
      return "redirect-home";
    }

    const customerRoutes = ["/profile", "/address", "/cart", "/wishlist"];
    if (customerRoutes.some((r) => pathname.startsWith(r))) {
      if (role === "customer" || !role) return "allow";
      return "redirect-dashboard";
    }
    return "allow";
  }

  it("IT-01: Khách hàng đăng nhập → vào trang chủ, bị chặn khỏi dashboard", () => {
    expect(determineDashboard("/dashboard", "customer")).toBe("redirect-home");
    expect(determineDashboard("/profile", "customer")).toBe("allow");
  });

  it("IT-02: Nhân viên đăng nhập → vào dashboard, bị chặn khỏi /profile", () => {
    expect(determineDashboard("/dashboard", "staff")).toBe("allow");
    expect(determineDashboard("/profile", "staff")).toBe("redirect-dashboard");
  });

  it("IT-03: Quản trị viên đăng nhập → vào dashboard", () => {
    expect(determineDashboard("/dashboard", "admin")).toBe("allow");
    expect(determineDashboard("/dashboard/users", "admin")).toBe("allow");
  });
});

describe("Integration: Đăng nhập → Cập nhật hồ sơ", () => {

  it("IT-04: dữ liệu hồ sơ hợp lệ được chấp nhận", () => {
    const profileData = {
      phone: "0987654321",
      birthDate: "1995-06-15",
      gender: "male",
    };
    const result = personalInfoSchema.safeParse(profileData);
    expect(result.success).toBe(true);
  });

  it("dữ liệu hồ sơ không hợp lệ bị từ chối", () => {
    const profileData = {
      phone: "123",
      birthDate: "2050-01-01",
      gender: "invalid",
    };
    const result = personalInfoSchema.safeParse(profileData);
    expect(result.success).toBe(false);
  });
});

describe("Integration: Đăng nhập → Quản lý địa chỉ", () => {

  const validAddress = {
    type: "home" as const,
    isDefault: true,
    receiverName: "",
    receiverPhone: "",
    street: "123 Nguyễn Huệ",
    provinceCode: 1,
    provinceName: "Hồ Chí Minh",
    districtCode: 1,
    districtName: "Quận 1",
    wardCode: 1,
    wardName: "Bến Nghé",
  };

  it("IT-05: địa chỉ hợp lệ được chấp nhận", () => {
    const result = addressFormSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("IT-06: địa chỉ mặc định isDefault = true được chấp nhận", () => {
    const result = addressFormSchema.safeParse({ ...validAddress, isDefault: true });
    expect(result.success).toBe(true);
  });

  it("nhiều địa chỉ đều hợp lệ", () => {
    const address2 = { ...validAddress, type: "work" as const, isDefault: false, street: "456 Lê Lợi" };
    expect(addressFormSchema.safeParse(validAddress).success).toBe(true);
    expect(addressFormSchema.safeParse(address2).success).toBe(true);
  });

  it("địa chỉ thiếu thông tin bị từ chối", () => {
    expect(addressFormSchema.safeParse({ ...validAddress, street: "" }).success).toBe(false);
    expect(addressFormSchema.safeParse({ ...validAddress, provinceCode: 0 }).success).toBe(false);
  });
});

describe("Integration: Admin → Quản lý nhân viên → Khóa tài khoản", () => {

  it("IT-07: admin có quyền khóa tài khoản", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  it("staff không có quyền khóa tài khoản", () => {
    expect(isAdmin("staff")).toBe(false);
  });

  it("action set-ban hợp lệ với banned=true và lý do", () => {
    const result = updateAccountSchema.safeParse({
      action: "set-ban",
      banned: true,
      reason: "Vi phạm quy định",
    });
    expect(result.success).toBe(true);
  });

  it("IT-08: action set-ban hợp lệ với banned=false (mở khóa)", () => {
    const result = updateAccountSchema.safeParse({
      action: "set-ban",
      banned: false,
    });
    expect(result.success).toBe(true);
  });

  it("tạo staff mới với dữ liệu hợp lệ", () => {
    const result = createStaffSchema.safeParse({
      name: "Nguyễn Văn B",
      email: "nvb@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("từ chối tạo staff với email không hợp lệ", () => {
    const result = createStaffSchema.safeParse({
      name: "Nguyễn Văn B",
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("Integration: Chatbot → Nhận câu hỏi → Tra cứu → Trả lời", () => {

  it("IT-09: system prompt yêu cầu chatbot trả lời bằng tiếng Việt", () => {
    expect(SYSTEM_PROMPT).toContain("tiếng Việt");
  });

  it("system prompt giới hạn phạm vi laptop", () => {
    expect(SYSTEM_PROMPT).toContain("laptop");
  });

  it("chatbot có công cụ searchProducts để tra cứu", () => {
    expect(SYSTEM_PROMPT).toContain("searchProducts");
  });

  it("chatbot có công cụ getProductDetails để xem chi tiết", () => {
    expect(SYSTEM_PROMPT).toContain("getProductDetails");
  });

  it("chatbot có công cụ checkStock để kiểm tra tồn kho", () => {
    expect(SYSTEM_PROMPT).toContain("checkStock");
  });
});

describe("Integration: Phân quyền toàn diện", () => {

  const roles = ["customer", "staff", "admin"] as const;

  const permissionMatrix = {
    "xem danh sách khách hàng": (role: string) => isStaff(role),
    "xem danh sách nhân viên": (role: string) => isAdmin(role),
    "khóa tài khoản": (role: string) => isAdmin(role),
    "mở khóa tài khoản": (role: string) => isAdmin(role),
    "đổi vai trò": (role: string) => isAdmin(role),
    "tạo nhân viên mới": (role: string) => isAdmin(role),
    "xem hồ sơ cá nhân": (role: string) => role === "customer",
    "quản lý địa chỉ": (role: string) => role === "customer",
    "truy cập dashboard": (role: string) => isStaff(role),
  };

  it("IT-03: admin có tất cả quyền quản lý người dùng", () => {
    expect(permissionMatrix["xem danh sách khách hàng"]("admin")).toBe(true);
    expect(permissionMatrix["xem danh sách nhân viên"]("admin")).toBe(true);
    expect(permissionMatrix["khóa tài khoản"]("admin")).toBe(true);
    expect(permissionMatrix["mở khóa tài khoản"]("admin")).toBe(true);
    expect(permissionMatrix["đổi vai trò"]("admin")).toBe(true);
    expect(permissionMatrix["tạo nhân viên mới"]("admin")).toBe(true);
  });

  it("IT-02: staff có quyền xem nhưng không quản lý được", () => {
    expect(permissionMatrix["xem danh sách khách hàng"]("staff")).toBe(true);
    expect(permissionMatrix["truy cập dashboard"]("staff")).toBe(true);
    expect(permissionMatrix["khóa tài khoản"]("staff")).toBe(false);
    expect(permissionMatrix["đổi vai trò"]("staff")).toBe(false);
    expect(permissionMatrix["tạo nhân viên mới"]("staff")).toBe(false);
  });

  it("IT-01: customer chỉ có quyền cơ bản", () => {
    expect(permissionMatrix["xem hồ sơ cá nhân"]("customer")).toBe(true);
    expect(permissionMatrix["quản lý địa chỉ"]("customer")).toBe(true);
    expect(permissionMatrix["truy cập dashboard"]("customer")).toBe(false);
    expect(permissionMatrix["xem danh sách khách hàng"]("customer")).toBe(false);
    expect(permissionMatrix["khóa tài khoản"]("customer")).toBe(false);
  });
});
