import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { ProductStatus } from "@/app/generated/prisma/client";
import { ProductFacade } from "@/features/product/lib/product";
import { createSlug } from "@/lib/slugify";
import { safeParseInt } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = safeParseInt(searchParams.get("page"), 1);
    const pageSize = safeParseInt(searchParams.get("pageSize"), 10);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all";
    const categoryId = searchParams.get("categoryId") ?? "all";
    const brandId = searchParams.get("brandId") ?? "all";
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const { data: products, total, stats } = await ProductFacade.getProductsList(
      { search, status, categoryId, brandId },
      { page, pageSize, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
    );

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("List products failed", error);
    return NextResponse.json({ error: "Unable to list products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { name, description, price, salePrice, stock, status, categoryId, brandId, specs, images } = body;


    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Tên sản phẩm không được để trống" }, { status: 400 });
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "Giá sản phẩm phải lớn hơn 0" }, { status: 400 });
    }

    if (salePrice !== undefined && salePrice !== null && salePrice !== "") {
      const salePriceNum = parseFloat(salePrice);
      if (isNaN(salePriceNum) || salePriceNum <= 0) {
        return NextResponse.json({ error: "Giá khuyến mãi phải lớn hơn 0" }, { status: 400 });
      }
      if (salePriceNum >= priceNum) {
        return NextResponse.json({ error: "Giá khuyến mãi phải nhỏ hơn giá gốc" }, { status: 400 });
      }
    }

    const stockNum = safeParseInt(stock, 0);
    if (stockNum < 0) {
      return NextResponse.json({ error: "Số lượng tồn kho không được âm" }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json({ error: "Danh mục không hợp lệ" }, { status: 400 });
    }

    if (!brandId || typeof brandId !== "string") {
      return NextResponse.json({ error: "Thương hiệu không hợp lệ" }, { status: 400 });
    }

    const normalizedSpecs = Array.isArray(specs)
      ? specs.filter(
          (spec): spec is { name: string; groupName?: string; value: string } =>
            typeof spec?.name === "string" &&
            typeof spec?.value === "string",
        )
      : [];
    const normalizedImages = Array.isArray(images)
      ? images
          .filter(
            (image): image is {
              imageUrl: string;
              isPrimary?: boolean;
              displayOrder?: number;
            } => typeof image?.imageUrl === "string",
          )
          .map((image, index) => ({
            imageUrl: image.imageUrl,
            isPrimary: image.isPrimary ?? index === 0,
            displayOrder: image.displayOrder ?? index,
          }))
      : [];

    const newProduct = await ProductFacade.createProductWithDetails({
      name,
      slug: createSlug(name) + "-" + Math.random().toString(36).substring(2, 7),
      description,
      price: priceNum,
      salePrice: (salePrice !== undefined && salePrice !== null && salePrice !== "") ? parseFloat(salePrice) : null,
      stock: stockNum,
      status: (status as ProductStatus) ?? ProductStatus.active,
      categoryId,
      brandId,
      specs: normalizedSpecs,
      images: normalizedImages,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Create product failed", error);
    return NextResponse.json({ error: "Unable to create product." }, { status: 500 });
  }
}
