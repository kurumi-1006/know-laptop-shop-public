import { NextResponse } from "next/server";
import { CategoryFacade } from "@/features/category/lib/category-facade";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam) : 3;

  if (isNaN(limit) || limit <= 0) {
    return NextResponse.json({ success: false, error: "Tham số limit không hợp lệ." }, { status: 400 });
  }

  try {
    const facade = new CategoryFacade();
    const data = await facade.getPopularCategories(limit);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
