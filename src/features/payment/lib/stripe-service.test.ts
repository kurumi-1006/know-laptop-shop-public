import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_12345";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_12345";
});

const mockCreateSession = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock("stripe", () => {
  return {
    default: class StripeMock {
      checkout = {
        sessions: {
          create: mockCreateSession,
        },
      };
      webhooks = {
        constructEvent: mockConstructEvent,
      };
    },
  };
});

import { StripeService } from "./stripe-service";

describe("StripeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isConfigured", () => {
    it("should return true when STRIPE_SECRET_KEY environment variable is present", () => {
      expect(StripeService.isConfigured()).toBe(true);
    });
  });

  describe("createCheckoutSession", () => {
    it("should create a checkout session and return payUrl and sessionId", async () => {
      mockCreateSession.mockResolvedValue({
        id: "sess_123",
        url: "https://stripe.com/pay/sess_123",
      });

      const result = await StripeService.createCheckoutSession({
        orderCode: "ORD-12345",
        amount: 250000,
      });

      expect(mockCreateSession).toHaveBeenCalledWith({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "vnd",
              product_data: {
                name: "Đơn hàng ORD-12345",
              },
              unit_amount: 250000,
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderCode: "ORD-12345",
        },
        success_url: expect.stringContaining("/checkout/result?orderId=ORD-12345&success=true"),
        cancel_url: expect.stringContaining("/checkout/result?orderId=ORD-12345&canceled=true"),
      });

      expect(result).toEqual({
        payUrl: "https://stripe.com/pay/sess_123",
        sessionId: "sess_123",
      });
    });

    it("should throw error if Stripe session does not contain URL", async () => {
      mockCreateSession.mockResolvedValue({
        id: "sess_123",
        url: null,
      });

      await expect(
        StripeService.createCheckoutSession({
          orderCode: "ORD-123",
          amount: 10000,
        })
      ).rejects.toThrow("Failed to create Stripe Checkout session URL.");
    });
  });

  describe("constructEvent", () => {
    it("should delegate signature verification to stripe.webhooks", () => {
      mockConstructEvent.mockReturnValue({ type: "payment_intent.succeeded" });

      const event = StripeService.constructEvent("payload_str", "sig_str");

      expect(mockConstructEvent).toHaveBeenCalledWith(
        "payload_str",
        "sig_str",
        "whsec_12345"
      );
      expect(event).toEqual({ type: "payment_intent.succeeded" });
    });
  });
});
