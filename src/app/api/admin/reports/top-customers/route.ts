import { auth } from "@/features/auth/lib/auth";
import { isAdmin } from "@/lib/roles";
import { ReportRepository } from "@/features/report/lib/report-repository";
import { generateCSVResponse } from "@/lib/csv.server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const data = await ReportRepository.getTopCustomers(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );

    if (format === "csv") {
      const rows = data.map((c) => ({
        "Tên KH": c.userName,
        "Email": c.userEmail,
        "Số đơn": c.orderCount,
        "Tổng chi tiêu": c.totalSpent,
      }));
      return generateCSVResponse(rows, "khach-hang-than-thiet.csv");
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Top customers report failed", error);
    return NextResponse.json({ error: "Không thể tạo báo cáo." }, { status: 500 });
  }
}
