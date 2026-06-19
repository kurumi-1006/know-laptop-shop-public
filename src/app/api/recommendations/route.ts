import {
  attachRecommendationSessionCookie,
  getRecommendationIdentity,
} from "@/features/recommendation/lib/recommendation-identity";
import { RecommendationService } from "@/features/recommendation/lib/recommendation.service";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendAiTrace,
  createAiTrace,
  isAiTraceEnabled,
} from "@/features/chat/lib/ai-trace";

const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(8).default(8),
  excludeProductId: z.string().trim().min(1).max(100).optional(),
  ai: z.enum(["true", "false"]).default("false"),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = recommendationQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Tham số đề xuất không hợp lệ." },
        { status: 400 },
      );
    }

    const identity = await getRecommendationIdentity(request);
    const traceId = createAiTrace("recommendation", identity.userId);
    appendAiTrace(traceId, "recommendation.request", {
      limit: parsed.data.limit,
      excludeProductId: parsed.data.excludeProductId,
      useAi: parsed.data.ai === "true",
      identity: identity.userId ? "user" : "anonymous-session",
    });
    const result = await new RecommendationService().getRecommendations({
      userId: identity.userId,
      sessionId: identity.sessionId,
      limit: parsed.data.limit,
      excludeProductId: parsed.data.excludeProductId,
      useAi: parsed.data.ai === "true",
      traceId,
    });

    return attachRecommendationSessionCookie(
      NextResponse.json({
        ...result,
        ...(isAiTraceEnabled() ? { traceId } : {}),
      }),
      identity,
    );
  } catch (error) {
    console.error("Recommendation API failed", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải gợi ý lúc này." },
      { status: 500 },
    );
  }
}
