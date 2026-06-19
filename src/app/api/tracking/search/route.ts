import {
  attachRecommendationSessionCookie,
  buildIdentityWhere,
  getRecommendationIdentity,
} from "@/features/recommendation/lib/recommendation-identity";
import { searchHistorySchema } from "@/features/recommendation/schemas/tracking.schema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const parsed = searchHistorySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Từ khóa tìm kiếm không hợp lệ." },
        { status: 400 },
      );
    }

    const identity = await getRecommendationIdentity(request);
    const keyword = parsed.data.keyword.replace(/\s+/g, " ");
    const recentSearch = await prisma.searchHistory.findFirst({
      where: {
        ...buildIdentityWhere(identity),
        keyword: { equals: keyword, mode: "insensitive" },
        createdAt: {
          gte: new Date(Date.now() - DEDUPLICATION_WINDOW_MS),
        },
      },
      select: { id: true },
    });

    if (!recentSearch) {
      await prisma.searchHistory.create({
        data: {
          userId: identity.userId,
          sessionId: identity.sessionId,
          keyword,
        },
      });
    }

    return attachRecommendationSessionCookie(
      NextResponse.json({ success: true, created: !recentSearch }),
      identity,
    );
  } catch (error) {
    console.error("Search tracking failed", error);
    return NextResponse.json(
      { success: false, error: "Không thể lưu lịch sử tìm kiếm." },
      { status: 500 },
    );
  }
}
