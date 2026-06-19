import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { auth } from "@/features/auth/lib/auth";
import { CartFacade, CartAccessError } from "@/features/cart/lib/cart-facade";

vi.mock("@/features/auth/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(),
  })),
}));

const mockAssertCustomer = vi.fn();
const mockGetCart = vi.fn();

vi.mock("@/features/cart/lib/cart-facade", () => {
  return {
    CartFacade: class CartFacadeMock {
      assertCustomer = mockAssertCustomer;
      getCart = mockGetCart;
    },
    CartAccessError: class extends Error {
      constructor(message: string, readonly status: number) {
        super(message);
      }
    },
  };
});

describe("/api/cart API Route", () => {
  let facadeInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    facadeInstance = new CartFacade();
  });

  it("returns 401 Unauthorized when there is no session or user is blocked", async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    facadeInstance.assertCustomer.mockImplementation(() => {
      throw new CartAccessError("Unauthorized", 401);
    });

    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns cart items with 200 on success", async () => {
    const mockUser = { id: "user-1", role: "customer" };
    (auth.api.getSession as any).mockResolvedValue({ user: mockUser });
    facadeInstance.assertCustomer.mockReturnValue(undefined);
    facadeInstance.getCart.mockResolvedValue([
      { id: "item-1", productId: "p-1", quantity: 2 },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([{ id: "item-1", productId: "p-1", quantity: 2 }]);
    expect(facadeInstance.getCart).toHaveBeenCalledWith(mockUser);
  });
});
