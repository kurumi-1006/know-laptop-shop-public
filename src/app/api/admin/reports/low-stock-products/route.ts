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
    const threshold = parseInt(searchParams.get("threshold") ?? "5");

    const data = await ReportRepository.getLowStockProducts(threshold);

    if (format === "csv") {
      const rows = data.map((p) => ({
        "Mã SP": p.id,
        "Tên sản phẩm": p.name,
        "Tồn kho": p.stock,
        "Giá": Number(p.price),
      }));
      return generateCSVResponse(rows, "san-pham-sap-het-hang.csv");
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Low stock report failed", error);
    return NextResponse.json({ error: "Không thể tạo báo cáo." }, { status: 500 });
  }
}
