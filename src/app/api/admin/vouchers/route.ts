import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { DiscountType } from "@/app/generated/prisma/client";
import { CouponFacade } from "@/features/coupon/lib/coupon";
import { safeParseInt } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const page = safeParseInt(searchParams.get("page"), 1);
    const pageSize = safeParseInt(searchParams.get("pageSize"), 10);

    const { data: vouchers, total, stats } = await CouponFacade.getVouchersList({ page, pageSize, search });

    return NextResponse.json({
      data: vouchers,
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
    console.error("List vouchers failed", error);
    return NextResponse.json({ error: "Unable to list vouchers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { code, name, discountType, discountValue, startDate, endDate, minOrderValue, maxDiscountValue, quantity } = body;

    if (!code || code.trim() === "") {
      return NextResponse.json({ error: "Mã voucher không được để trống" }, { status: 400 });
    }

    const discountVal = parseFloat(discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      return NextResponse.json({ error: "Giá trị giảm giá phải lớn hơn 0" }, { status: 400 });
    }

    if (discountType === DiscountType.percent && discountVal > 100) {
      return NextResponse.json({ error: "Phần trăm giảm giá tối đa là 100%" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Ngày hiệu lực không hợp lệ" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" }, { status: 400 });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Số lượng sử dụng phải lớn hơn 0" }, { status: 400 });
    }

    const codeFormatted = code.trim().toUpperCase();


    const existing = await CouponFacade.getByCode(codeFormatted);

    if (existing && !existing.isDeleted) {
      return NextResponse.json({ error: "Mã voucher này đã tồn tại" }, { status: 400 });
    }

    const voucherData = {
      code: codeFormatted,
      name,
      discountType: discountType as DiscountType,
      discountValue: discountVal,
      startDate: start,
      endDate: end,
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
      maxDiscountValue: maxDiscountValue ? parseFloat(maxDiscountValue) : null,
      quantity: qty,
      isActive: true,
      isDeleted: false,
    };


    const voucher = existing
      ? await CouponFacade.update(existing.id, voucherData)
      : await CouponFacade.create(voucherData);

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Create voucher failed", error);
    return NextResponse.json({ error: "Unable to create voucher." }, { status: 500 });
  }
}
