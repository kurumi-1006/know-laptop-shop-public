import { auth } from "@/features/auth/lib/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { hasRole } from "@/lib/roles";
import { OrderFacade, OrderAccessError } from "@/features/order/lib/order-facade";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(session.user.role, [UserRole.admin, UserRole.staff])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all";
    const paymentStatus = searchParams.get("paymentStatus") ?? "all";

    const result = await OrderFacade.getAllOrders(
      session.user,
      { search, status, paymentStatus },
      page,
      pageSize,
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof OrderAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Admin orders request failed", error);
  return NextResponse.json(
    { error: "Không thể xử lý yêu cầu." },
    { status: 500 },
  );
}
