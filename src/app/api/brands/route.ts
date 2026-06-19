import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/auth-helpers";
import { auth } from "@/features/auth/lib/auth";
import { BrandFacade } from "@/features/brand/lib/brand-facade";
import { brandQuerySchema, createBrandSchema } from "@/features/brand/schemas/brand.schema";

const getSession = (req: Request) => auth.api.getSession({ headers: req.headers });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = Object.fromEntries(searchParams.entries());

  const parsed = brandQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Tham số không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const facade = new BrandFacade();
    const result = await facade.listBrands(parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);
  const body = await request.json();

  const parsed = createBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const facade = new BrandFacade();
    const data = await facade.createBrand(session?.user?.role, parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
