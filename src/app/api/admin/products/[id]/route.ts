import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";
import { ProductStatus } from "@/app/generated/prisma/client";
import { ProductFacade } from "@/features/product/lib/product";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const productId = id;
  if (!productId) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const product = await ProductFacade.getProductDetail(productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const productId = id;
  if (!productId) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, price, salePrice, stock, status, categoryId, brandId, specs } = body;


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

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      return NextResponse.json({ error: "Số lượng tồn kho không được âm" }, { status: 400 });
    }

    if (!categoryId || !brandId) {
      return NextResponse.json({ error: "Danh mục hoặc thương hiệu không hợp lệ" }, { status: 400 });
    }

    const updatedProduct = await ProductFacade.updateProduct(productId, {
      name,
      description,
      price: priceNum,
      salePrice: (salePrice !== undefined && salePrice !== null && salePrice !== "") ? parseFloat(salePrice) : null,
      stock: stockNum,
      status: (status as ProductStatus) ?? ProductStatus.active,
      categoryId,
      brandId,
      specs,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Update product failed", error);
    return NextResponse.json({ error: "Unable to update product." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const productId = id;
  if (!productId) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const deletedProduct = await ProductFacade.deleteProduct(productId);

    return NextResponse.json({ success: true, product: deletedProduct });
  } catch (error) {
    console.error("Soft delete product failed", error);
    return NextResponse.json({ error: "Unable to delete product." }, { status: 500 });
  }
}
