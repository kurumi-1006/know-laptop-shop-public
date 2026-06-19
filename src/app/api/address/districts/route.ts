import { getDistrictsByProvince } from "@/lib/addresses";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = parseInt(searchParams.get("province_code") ?? "", 10);
  if (isNaN(code)) {
    return NextResponse.json(
      { error: "province_code is required" },
      { status: 400 },
    );
  }
  return NextResponse.json(getDistrictsByProvince(code), {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
