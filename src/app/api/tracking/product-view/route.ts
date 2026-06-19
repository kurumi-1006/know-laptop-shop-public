import {
  attachRecommendationSessionCookie,
  buildIdentityWhere,
  getRecommendationIdentity,
} from "@/features/recommendation/lib/recommendation-identity";
import { productViewSchema } from "@/features/recommendation/schemas/tracking.schema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEDUPLICATION_WINDOW_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Body không phải JSON hợp lệ." },
        { status: 400 },
      );
    }

    const parsed = productViewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Product ID không hợp lệ." },
        { status: 400 },
      );
    }

    const identity = await getRecommendationIdentity(request);
    const product = await prisma.product.findFirst({
      where: {
        id: parsed.data.productId,
        isDeleted: false,
        status: "active",
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Sản phẩm không tồn tại." },
        { status: 404 },
      );
    }

    const recentView = await prisma.productView.findFirst({
      where: {
        ...buildIdentityWhere(identity),
        productId: product.id,
        createdAt: {
          gte: new Date(Date.now() - DEDUPLICATION_WINDOW_MS),
        },
      },
      select: { id: true },
    });

    if (!recentView) {
      await prisma.productView.create({
        data: {
          userId: identity.userId,
          sessionId: identity.sessionId,
          productId: product.id,
        },
      });
    }

    return attachRecommendationSessionCookie(
      NextResponse.json({ success: true, created: !recentView }),
      identity,
    );
  } catch (error) {
    console.error("Product view tracking failed", error);
    return NextResponse.json(
      { success: false, error: "Không thể lưu lịch sử xem." },
      { status: 500 },
    );
  }
}
