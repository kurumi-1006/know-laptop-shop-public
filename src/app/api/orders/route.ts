import { auth } from "@/features/auth/lib/auth";
import { OrderFacade, OrderAccessError } from "@/features/order/lib/order-facade";
import { checkoutSchema } from "@/features/order/schemas/order.schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");

    const result = await OrderFacade.getMyOrders(session.user, page);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const order = await OrderFacade.checkout(session.user, parsed.data);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof OrderAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Order request failed", error);
  return NextResponse.json(
    { error: "Không thể xử lý yêu cầu." },
    { status: 500 },
  );
}
