import { NextRequest, NextResponse } from "next/server";
import { StripeService } from "@/features/payment/lib/stripe-service";
import prisma from "@/lib/prisma";
import { OrderRepository } from "@/features/order/lib/order-repository";
import { OrderStatus, PaymentStatus } from "@/app/generated/prisma/enums";
import { cancelOrderAndReleaseResources } from "@/features/order/lib/order-cancellation";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature found" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = StripeService.constructEvent(body, signature);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook signature verification failed.`, message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (error) {
    console.error(`Error handling Stripe event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderCode = session.metadata?.orderCode;
      if (!orderCode) return;

      if (session.payment_status === "paid") {
        const paymentIntentId = session.payment_intent as string | undefined;
        const sessionId = session.id as string;
        await handlePaymentSuccess(orderCode, paymentIntentId, sessionId);
      } else if (session.payment_status === "unpaid") {
        console.log(`Order ${orderCode}: checkout completed but payment still unpaid. Waiting...`);
      }
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderCode = session.metadata?.orderCode;
      if (!orderCode) return;
      const paymentIntentId = session.payment_intent as string | undefined;
      const sessionId = session.id as string;
      await handlePaymentSuccess(orderCode, paymentIntentId, sessionId);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderCode = session.metadata?.orderCode;
      if (!orderCode) return;
      await handlePaymentFailed(orderCode);
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderCode = session.metadata?.orderCode;
      if (!orderCode) return;
      await handlePaymentFailed(orderCode);
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderCode = intent.metadata?.orderCode;
      if (!orderCode) return;
      console.warn(
        `Order ${orderCode}: a payment attempt failed. Waiting for the Checkout Session's final state.`,
      );
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
}





async function handlePaymentSuccess(
  orderCode: string,
  paymentIntentId?: string,
  sessionId?: string,
) {
  const order = await prisma.orders.findUnique({
    where: { orderCode },
    select: { id: true, status: true, paymentStatus: true },
  });

  if (!order) {
    console.warn(`Stripe webhook: order ${orderCode} not found.`);
    return;
  }


  if (order.paymentStatus === PaymentStatus.paid) {
    console.log(`Order ${orderCode} already marked as paid. Skipping.`);
    return;
  }


  if (order.status === OrderStatus.cancelled) {
    console.warn(
      `Order ${orderCode} is cancelled but payment was received. ` +
      `Manual review required.`,
    );
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.paid,
        paidAt: new Date(),
        paymentSessionId: sessionId ?? paymentIntentId,
      },
    });
    return;
  }


  const newStatus =
    order.status === OrderStatus.pending ? OrderStatus.confirmed : order.status;

  await OrderRepository.updateStatus(prisma, order.id, newStatus, {
    paymentStatus: PaymentStatus.paid,
    paidAt: new Date(),
    paymentSessionId: sessionId ?? paymentIntentId ?? null,
  });

  console.log(
    `Order ${orderCode}: payment received. ` +
    `status: ${order.status} → ${newStatus}, paymentStatus → paid, paidAt saved.`,
  );
}





async function handlePaymentFailed(orderCode: string) {
  const order = await prisma.orders.findUnique({
    where: { orderCode },
    select: { id: true, status: true, paymentStatus: true },
  });

  if (!order) {
    console.warn(`Stripe webhook: order ${orderCode} not found.`);
    return;
  }

  if (
    order.paymentStatus === PaymentStatus.paid ||
    order.status === OrderStatus.cancelled
  ) {
    console.log(
      `Order ${orderCode} paymentStatus is ${order.paymentStatus}, not updating to failed.`,
    );
    return;
  }

  await prisma.$transaction((tx) =>
    cancelOrderAndReleaseResources(tx, order.id, {
      allowedStatuses: [OrderStatus.pending, OrderStatus.confirmed],
      paymentStatuses: [PaymentStatus.unpaid, PaymentStatus.failed],
      paymentStatus: PaymentStatus.failed,
    }),
  );

  console.log(
    `Order ${orderCode}: payment failed. Order cancelled and reserved resources released.`,
  );
}
