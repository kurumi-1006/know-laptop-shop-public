import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/auth-helpers";
import { auth } from "@/features/auth/lib/auth";
import { CategoryFacade } from "@/features/category/lib/category-facade";
import { updateCategorySchema } from "@/features/category/schemas/category.schema";

const getSession = (req: Request) => auth.api.getSession({ headers: req.headers });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const facade = new CategoryFacade();
    const data = await facade.getCategory(id);
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

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const facade = new CategoryFacade();
    const data = await facade.updateCategory(session?.user?.role, id, parsed.data);
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
    const facade = new CategoryFacade();
    const data = await facade.deleteCategory(session?.user?.role, id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
