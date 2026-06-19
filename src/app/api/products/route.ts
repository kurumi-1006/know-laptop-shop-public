import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProductFacade } from "@/features/product/lib/product";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const categorySlug = searchParams.get("category");
  const brandSlug = searchParams.get("brand");
  const search = searchParams.get("search") || undefined;

  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const cpu = searchParams.get("cpu") || undefined;
  const ram = searchParams.get("ram") || undefined;
  const storage = searchParams.get("storage") || undefined;
  const display = searchParams.get("display") || undefined;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  try {
    let categoryId: string | undefined = undefined;
    if (categorySlug) {
      const categoryObj = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      categoryId = categoryObj ? String(categoryObj.id) : "-1";
    }


    const specFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("spec_")) {
        specFilters[key] = value;
      }
    });

    let brandId: string | undefined = undefined;
    if (brandSlug) {
      const slugs = brandSlug.split(",");
      const brandObjs = await prisma.brand.findMany({
        where: { slug: { in: slugs } },
      });
      brandId = brandObjs.length > 0 ? brandObjs.map(b => b.id).join(",") : "-1";
    }

    const filters = {
      search,
      status: "active",
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      cpu,
      ram,
      storage,
      display,
      ...specFilters,
    };

    const pagination = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    const result = await ProductFacade.getProductsList(filters, pagination);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      pageSize,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch products API:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách sản phẩm." },
      { status: 500 }
    );
  }
}
