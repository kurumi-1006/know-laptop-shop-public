import { auth } from "@/features/auth/lib/auth";
import { CouponFacade } from "@/features/coupon/lib/coupon";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { valid: false, message: "Vui lòng đăng nhập để kiểm tra mã giảm giá." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { code, orderValue, items } = body;

    if (!code || !orderValue) {
      return NextResponse.json(
        { valid: false, message: "Thiếu mã giảm giá hoặc giá trị đơn hàng." },
        { status: 400 },
      );
    }

    const result = await CouponFacade.validate(
      code,
      orderValue,
      items ?? [],
      session.user.id,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Voucher validate failed", error);
    return NextResponse.json(
      { valid: false, message: "Không thể kiểm tra mã giảm giá." },
      { status: 500 },
    );
  }
}
