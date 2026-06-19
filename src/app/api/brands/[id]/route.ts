import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/auth-helpers";
import { auth } from "@/features/auth/lib/auth";
import { BrandFacade } from "@/features/brand/lib/brand-facade";
import { updateBrandSchema } from "@/features/brand/schemas/brand.schema";

const getSession = (req: Request) => auth.api.getSession({ headers: req.headers });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const facade = new BrandFacade();
    const data = await facade.getBrand(id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Not found";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(request);
  const body = await request.json();

  const parsed = updateBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const facade = new BrandFacade();
    const data = await facade.updateBrand(session?.user?.role, id, parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(request);

  try {
    const facade = new BrandFacade();
    const data = await facade.deleteBrand(session?.user?.role, id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json({
        success: false,
        error: "Không thể xóa thương hiệu này vì đang có sản phẩm liên kết. Vui lòng chuyển trạng thái thương hiệu sang ẩn thay thế."
      }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
