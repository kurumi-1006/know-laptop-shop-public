import Stripe from "stripe";
import { env } from "@/env";

interface StripeCreateParams {
  orderCode: string;
  amount: number;
}

interface StripeCreateResult {
  payUrl: string;
  sessionId: string;
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key is not configured.");
    }
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return stripeInstance;
}

export class StripeService {
  static isConfigured(): boolean {
    return Boolean(STRIPE_SECRET_KEY);
  }

  static async createCheckoutSession({
    orderCode,
    amount,
  }: StripeCreateParams): Promise<StripeCreateResult> {
    if (!this.isConfigured()) {
      throw new Error("Stripe is not configured.");
    }

    try {
      const session = await getStripeInstance().checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "vnd",
              product_data: {
                name: `Đơn hàng ${orderCode}`,
              },


              unit_amount: Math.round(amount),
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderCode,
        },
        success_url: `${NEXT_PUBLIC_APP_URL}/checkout/result?orderId=${orderCode}&success=true`,
        cancel_url: `${NEXT_PUBLIC_APP_URL}/checkout/result?orderId=${orderCode}&canceled=true`,
      });

      if (!session.url) {
        throw new Error("Failed to create Stripe Checkout session URL.");
      }

      return { payUrl: session.url, sessionId: session.id };
    } catch (error) {
      console.error("Stripe createCheckoutSession error:", error);
      throw error;
    }
  }

  static constructEvent(payload: string, signature: string): Stripe.Event {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook secret is not configured.");
    }
    return getStripeInstance().webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  }
}
