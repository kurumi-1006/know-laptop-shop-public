import { NextResponse } from "next/server";
import { CategoryFacade } from "@/features/category/lib/category-facade";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const facade = new CategoryFacade();

    const category = await facade.getCategory(id);
    const data = await facade.getCategoryConfigAndFilters(category.slug);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
