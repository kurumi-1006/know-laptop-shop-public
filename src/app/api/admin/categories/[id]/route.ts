import { auth } from "@/features/auth/lib/auth";
import { ProductFacade } from "@/features/product/lib/product";
import { createSlug } from "@/lib/slugify";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, parentId, isActive } = body;

    if (name !== undefined && (!name || name.trim() === "")) {
      return NextResponse.json({ error: "Tên danh mục không được để trống" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = createSlug(name.trim());
    }
    if (description !== undefined) data.description = description || null;
    if (parentId !== undefined) data.parentId = parentId || null;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await ProductFacade.updateCategory(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update category failed", error);
    return NextResponse.json({ error: "Unable to update category." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await ProductFacade.deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category failed", error);
    return NextResponse.json({ error: "Unable to delete category." }, { status: 500 });
  }
}
