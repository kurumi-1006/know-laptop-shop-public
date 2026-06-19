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

    const data = await ReportRepository.getBestSellingProducts(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );

    if (format === "csv") {
      const rows = data.map((p) => ({
        "Mã SP": p.productId,
        "Tên sản phẩm": p.productName,
        "Số lượng bán": p.totalSold,
        "Doanh thu": p.totalRevenue,
      }));
      return generateCSVResponse(rows, "san-pham-ban-chay.csv");
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Best selling report failed", error);
    return NextResponse.json({ error: "Không thể tạo báo cáo." }, { status: 500 });
  }
}
