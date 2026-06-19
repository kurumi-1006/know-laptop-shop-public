import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { auth } from "@/features/auth/lib/auth";
import { BrandFacade } from "@/features/brand/lib/brand-facade";
import { ForbiddenError } from "@/lib/auth-helpers";

vi.mock("@/features/auth/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const mockListBrands = vi.fn();
const mockCreateBrand = vi.fn();

vi.mock("@/features/brand/lib/brand-facade", () => {
  return {
    BrandFacade: class BrandFacadeMock {
      listBrands = mockListBrands;
      createBrand = mockCreateBrand;
    },
  };
});

describe("/api/brands API Route", () => {
  let facadeInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    facadeInstance = new BrandFacade();
  });

  describe("GET", () => {
    it("returns 400 when query parameters fail zod validation", async () => {
      const request = new Request("http://localhost/api/brands?page=-1");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Tham số không hợp lệ.");
    });

    it("returns list of brands successfully with 200", async () => {
      facadeInstance.listBrands.mockResolvedValue({
        data: [{ id: "brand-1", name: "Apple", slug: "apple" }],
        total: 1,
      });

      const request = new Request("http://localhost/api/brands?page=1&pageSize=10");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([{ id: "brand-1", name: "Apple", slug: "apple" }]);
      expect(body.total).toBe(1);
    });
  });

  describe("POST", () => {
    it("returns 400 when body validation fails", async () => {
      const request = new Request("http://localhost/api/brands", {
        method: "POST",
        body: JSON.stringify({ name: "", slug: "invalid slug" }),
      });
      (auth.api.getSession as any).mockResolvedValue({ user: { role: "admin" } });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Dữ liệu không hợp lệ.");
    });

    it("returns 403 when user is not authorized to create brand", async () => {
      const request = new Request("http://localhost/api/brands", {
        method: "POST",
        body: JSON.stringify({
          name: "Dell",
          slug: "dell",
          isActive: true,
        }),
      });

      (auth.api.getSession as any).mockResolvedValue({ user: { role: "customer" } });
      facadeInstance.createBrand.mockRejectedValue(new ForbiddenError("Bạn không có quyền thực hiện hành động này."));

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Bạn không có quyền thực hiện hành động này.");
    });

    it("returns 200 and created brand on success", async () => {
      const request = new Request("http://localhost/api/brands", {
        method: "POST",
        body: JSON.stringify({
          name: "Dell",
          slug: "dell",
          isActive: true,
        }),
      });

      (auth.api.getSession as any).mockResolvedValue({ user: { role: "admin" } });
      facadeInstance.createBrand.mockResolvedValue({ id: "brand-dell", name: "Dell", slug: "dell" });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: "brand-dell", name: "Dell", slug: "dell" });
    });
  });
});
