import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { ProductFacade } from "@/features/product/lib/product";
import { createSlug } from "@/lib/slugify";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const categories = await ProductFacade.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to list categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Tên danh mục không được để trống" }, { status: 400 });
    }

    const category = await ProductFacade.createCategory({
      name: name.trim(),
      slug: createSlug(name.trim()),
      description: description || null,
      parentId: parentId || null,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Create category failed", error);
    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
