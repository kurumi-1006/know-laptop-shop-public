import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";
import { DiscountType } from "@/app/generated/prisma/client";
import { CouponFacade } from "@/features/coupon/lib/coupon";

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

  const voucherId = id;
  if (!voucherId) {
    return NextResponse.json({ error: "Invalid voucher ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { code, name, discountType, discountValue, startDate, endDate, minOrderValue, maxDiscountValue, quantity, isActive } = body;

    const existingVoucher = await CouponFacade.getById(voucherId);

    if (!existingVoucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

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


    const existingWithCode = await CouponFacade.getByCode(codeFormatted);

    if (existingWithCode && existingWithCode.id !== voucherId && !existingWithCode.isDeleted) {
      return NextResponse.json({ error: "Mã voucher này đã tồn tại" }, { status: 400 });
    }

    const updatedVoucher = await CouponFacade.update(voucherId, {
      code: codeFormatted,
      name,
      discountType: discountType as DiscountType,
      discountValue: discountVal,
      startDate: start,
      endDate: end,
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
      maxDiscountValue: maxDiscountValue ? parseFloat(maxDiscountValue) : null,
      quantity: qty,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    return NextResponse.json(updatedVoucher);
  } catch (error) {
    console.error("Update voucher failed", error);
    return NextResponse.json({ error: "Unable to update voucher." }, { status: 500 });
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

  const voucherId = id;
  if (!voucherId) {
    return NextResponse.json({ error: "Invalid voucher ID" }, { status: 400 });
  }

  try {
    const deletedVoucher = await CouponFacade.update(voucherId, { isDeleted: true });

    return NextResponse.json({ success: true, voucher: deletedVoucher });
  } catch (error) {
    console.error("Soft delete voucher failed", error);
    return NextResponse.json({ error: "Unable to delete voucher." }, { status: 500 });
  }
}
