import { NextResponse } from "next/server";
import { ProductFacade } from "@/features/product/lib/product";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = id;

  if (!productId) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const product = await ProductFacade.getPublicProductDetail(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Failed to fetch product detail", error);
    return NextResponse.json({ error: "Không thể tải chi tiết sản phẩm." }, { status: 500 });
  }
}
