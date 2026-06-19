import { getWardsByDistrict } from "@/lib/addresses";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = parseInt(searchParams.get("district_code") ?? "", 10);
  if (isNaN(code)) {
    return NextResponse.json(
      { error: "district_code is required" },
      { status: 400 },
    );
  }
  return NextResponse.json(getWardsByDistrict(code), {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
