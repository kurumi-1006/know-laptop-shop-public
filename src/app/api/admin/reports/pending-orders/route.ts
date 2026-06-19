import { auth } from "@/features/auth/lib/auth";
import { isStaff } from "@/lib/roles";
import { ReportRepository } from "@/features/report/lib/report-repository";
import { generateCSVResponse } from "@/lib/csv.server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isStaff(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const orders = await ReportRepository.getPendingOrders();

    if (format === "csv") {
      const rows = orders.map((o) => ({
        "Mã đơn": o.orderCode,
        "Khách hàng": o.user?.name ?? o.user?.email ?? "",
        "Ngày đặt": o.createdAt.toISOString(),
        "Tổng tiền": Number(o.total),
        "Tên người nhận": o.receiverName,
        "SĐT": o.receiverPhone,
      }));
      return generateCSVResponse(rows, "don-cho-xac-nhan.csv");
    }

    return NextResponse.json({ data: orders });
  } catch (error) {
    console.error("Pending orders report failed", error);
    return NextResponse.json({ error: "Không thể tạo báo cáo." }, { status: 500 });
  }
}
