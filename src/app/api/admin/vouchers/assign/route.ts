import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";
import { CouponFacade } from "@/features/coupon/lib/coupon";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { voucherId, productId, productIds, voucherIds } = await request.json();

    if (voucherId && Array.isArray(productIds)) {
      if (typeof voucherId !== "string" || voucherId.trim() === "") {
        return NextResponse.json({ error: "Voucher ID không hợp lệ" }, { status: 400 });
      }

      const parsedProductIds = productIds.filter(pid => typeof pid === "string" && pid.trim() !== "");
      await CouponFacade.linkVoucherToProductsBatch(voucherId, parsedProductIds);

      return NextResponse.json({ success: true });
    }

    if (productId && Array.isArray(voucherIds)) {
      if (typeof productId !== "string" || productId.trim() === "") {
        return NextResponse.json({ error: "Product ID không hợp lệ" }, { status: 400 });
      }

      const parsedVoucherIds = voucherIds.filter(vid => typeof vid === "string" && vid.trim() !== "");
      await CouponFacade.linkCouponsToProduct(productId, parsedVoucherIds);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Thông tin không đầy đủ" }, { status: 400 });
  } catch (error) {
    console.error("Assign voucher failed", error);
    return NextResponse.json({ error: "Unable to assign voucher." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const voucherId = searchParams.get("voucherId");
  const productId = searchParams.get("productId");

  if (!voucherId || !productId) {
    return NextResponse.json({ error: "Voucher ID hoặc Product ID không hợp lệ" }, { status: 400 });
  }

  try {
    await CouponFacade.unlinkProductCoupon(productId, voucherId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove voucher failed", error);
    return NextResponse.json({ error: "Unable to remove voucher." }, { status: 500 });
  }
}
