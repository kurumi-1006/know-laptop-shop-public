import { auth } from "@/features/auth/lib/auth";
import { CouponFacade } from "@/features/coupon/lib/coupon";
import { CartFacade } from "@/features/cart/lib/cart-facade";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem danh sách mã giảm giá." },
        { status: 401 },
      );
    }

    const vouchers = await CouponFacade.getActiveList();

    const { searchParams } = new URL(request.url);
    const itemsParam = searchParams.get("items");

    if (itemsParam) {
      const selectedProductIds = itemsParam.split(",").filter(Boolean);
      if (selectedProductIds.length > 0) {
        const facade = new CartFacade();
        const cartItems = await facade.getCart(session.user);

        const filteredCartItems = cartItems.filter((item) =>
          selectedProductIds.includes(item.productId)
        );

        const subtotal = filteredCartItems.reduce((sum, item) => {
          const price = Number(item.product.salePrice ?? item.product.price);
          return sum + price * item.quantity;
        }, 0);

        const validationItems = filteredCartItems.map((item) => ({
          productId: item.productId,
          price: Number(item.product.salePrice ?? item.product.price),
          quantity: item.quantity,
        }));

        const validations = await Promise.all(
          vouchers.map(async (v) => {
            const res = await CouponFacade.validate(v.code, subtotal, validationItems, session.user.id);
            return { voucher: v, valid: res.valid };
          })
        );

        const validVouchers = validations
          .filter((val) => val.valid)
          .map((val) => val.voucher);

        return NextResponse.json(validVouchers);
      }
    }

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("Fetch active vouchers failed", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách mã giảm giá." },
      { status: 500 },
    );
  }
}
