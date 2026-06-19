import { getProvinces } from "@/lib/addresses";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(getProvinces(), {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
