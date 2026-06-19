import { auth } from "@/features/auth/lib/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { hasRole } from "@/lib/roles";
import { OrderFacade, OrderAccessError } from "@/features/order/lib/order-facade";
import { OrderStatus } from "@/app/generated/prisma/enums";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(session.user.role, [UserRole.admin, UserRole.staff])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const order = await OrderFacade.getOrderDetail(session.user, id);
    return NextResponse.json({ data: order });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(session.user.role, [UserRole.admin, UserRole.staff])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: "Thiếu trạng thái cần cập nhật." }, { status: 400 });
    }

    const newStatus = body.status as OrderStatus;
    if (!Object.values(OrderStatus).includes(newStatus)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const order = await OrderFacade.updateOrderStatus(
      session.user,
      id,
      newStatus,
    );
    return NextResponse.json({ data: order });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof OrderAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Admin order detail request failed", error);
  return NextResponse.json(
    { error: "Không thể xử lý yêu cầu." },
    { status: 500 },
  );
}
