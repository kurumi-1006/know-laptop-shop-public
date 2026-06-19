import { auth } from "@/features/auth/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
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
    const search = searchParams.get("search") ?? "";
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");


    let status = searchParams.get("status") ?? "all";
    const paymentStatus = searchParams.get("paymentStatus") ?? "all";

    if (!isAdmin(session.user.role)) {
      status = "pending";
    }

    const data = await ReportRepository.getOrdersForReport({
      search,
      status,
      paymentStatus,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    if (format === "csv") {
      const rows = data.map((o) => ({
        "Mã đơn": o.orderCode,
        "Khách hàng": o.user?.name ?? o.user?.email ?? "",
        "Ngày đặt": o.createdAt.toISOString(),
        "Trạng thái": o.status,
        "Thanh toán": o.paymentStatus,
        "Tổng tiền": Number(o.total),
        "Tên người nhận": o.receiverName,
        "SĐT": o.receiverPhone,
      }));
      return generateCSVResponse(rows, "danh-sach-don-hang.csv");
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Orders report failed", error);
    return NextResponse.json({ error: "Không thể tạo báo cáo." }, { status: 500 });
  }
}
