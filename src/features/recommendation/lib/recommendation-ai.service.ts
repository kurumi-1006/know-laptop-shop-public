import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL,
} from "@/features/chat/constants";
import type {
  ScoredRecommendation,
  UserPreferenceProfile,
} from "./recommendation.types";
import { appendAiTrace } from "@/features/chat/lib/ai-trace";

const aiResponseSchema = z.object({
  productIds: z.array(z.string()).max(8),
});

export class RecommendationAiService {
  async rerank(
    profile: UserPreferenceProfile,
    scoredCandidates: ScoredRecommendation[],
    limit: number,
    traceId?: string,
  ) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || scoredCandidates.length === 0) return null;

    try {
      const deepseek = createOpenAI({
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL,
        name: "deepseek-recommendation",
      });
      const candidates = scoredCandidates.slice(0, 8);
      const promptPayload = {
        userProfile: {
          brands: profile.brandWeights,
          categories: profile.categoryWeights,
          priceRange: {
            min: profile.minPrice,
            max: profile.maxPrice,
          },
          recentSearches: profile.keywords,
          intents: profile.intents,
        },
        candidates: candidates.map(({ candidate, score }) => ({
          productId: candidate.id,
          name: candidate.name,
          price: candidate.price,
          salePrice: candidate.salePrice,
          stock: candidate.stock,
          brand: candidate.brand,
          category: candidate.category,
          specs: candidate.specs.slice(0, 5).map((spec) => spec.value),
          ruleScore: score,
        })),
        instruction: `Chọn tối đa ${limit} sản phẩm phù hợp nhất. Format: {"productIds":["id"]}`,
      };
      appendAiTrace(traceId ?? "", "recommendation.ai.input", promptPayload);
      const result = await generateText({
        model: deepseek.chat(process.env.DEEPSEEK_MODEL || DEEPSEEK_MODEL),
        temperature: 0.2,
        maxOutputTokens: 3000,
        system:
          "Bạn là trợ lý xếp hạng laptop. Chỉ chọn productId trong danh sách ứng viên. " +
          "Không giải thích, không trả markdown, chỉ trả JSON hợp lệ và thật ngắn gọn.",
        prompt: JSON.stringify(promptPayload),
      });
      appendAiTrace(traceId ?? "", "recommendation.ai.rawOutput", {
        text: result.text,
        usage: result.totalUsage,
        finishReason: result.finishReason,
      });

      const parsed = aiResponseSchema.safeParse(JSON.parse(extractJson(result.text)));
      if (!parsed.success || parsed.data.productIds.length === 0) return null;

      const candidatesById = new Map(
        candidates.map((scored) => [scored.candidate.id, scored]),
      );
      const seen = new Set<string>();
      const items = parsed.data.productIds.flatMap((productId) => {
        const scored = candidatesById.get(productId);
        if (!scored || seen.has(productId)) return [];
        seen.add(productId);
        return [{ scored }];
      });

      return items.length > 0 ? items.slice(0, limit) : null;
    } catch (error) {
      console.error("DeepSeek recommendation rerank failed", error);
      return null;
    }
  }
}

function extractJson(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("DeepSeek returned invalid JSON");
  return value.slice(start, end + 1);
}
