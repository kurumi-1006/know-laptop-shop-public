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
    const { name, logo, description, isActive } = body;

    if (name !== undefined && (!name || name.trim() === "")) {
      return NextResponse.json({ error: "Tên thương hiệu không được để trống" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = createSlug(name.trim());
    }
    if (logo !== undefined) data.logo = logo || null;
    if (description !== undefined) data.description = description || null;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await ProductFacade.updateBrand(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update brand failed", error);
    return NextResponse.json({ error: "Unable to update brand." }, { status: 500 });
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
    await ProductFacade.deleteBrand(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete brand failed", error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Không thể xóa thương hiệu này vì đang có sản phẩm liên kết. Vui lòng chuyển trạng thái thương hiệu sang ẩn thay thế." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Unable to delete brand." }, { status: 500 });
  }
}
