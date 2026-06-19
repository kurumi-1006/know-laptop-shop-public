import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { ProductFacade } from "@/features/product/lib/product";
import { createSlug } from "@/lib/slugify";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const brands = await ProductFacade.getAllBrands();
    return NextResponse.json(brands);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to list brands." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { name, logo, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Tên thương hiệu không được để trống" }, { status: 400 });
    }

    const brand = await ProductFacade.createBrand({
      name: name.trim(),
      slug: createSlug(name.trim()),
      logo: logo || null,
      description: description || null,
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Create brand failed", error);
    return NextResponse.json({ error: "Unable to create brand." }, { status: 500 });
  }
}
