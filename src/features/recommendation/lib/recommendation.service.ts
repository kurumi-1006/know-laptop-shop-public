import prisma from "@/lib/prisma";
import { normalizeVietnamese } from "@/lib/normalize-text";
import {
  buildRecommendationReason,
  diversifyResults,
  inferIntents,
  inferPriceRange,
  scoreCandidates,
} from "./recommendation-scorer";
import { RecommendationAiService } from "./recommendation-ai.service";
import { TtlCache } from "./recommendation-cache";
import type {
  RecommendationCandidate,
  RecommendationItem,
  RecommendationResult,
  UserPreferenceProfile,
} from "./recommendation.types";
import { appendAiTrace } from "@/features/chat/lib/ai-trace";

interface RecommendationOptions {
  userId: string | null;
  sessionId: string | null;
  limit?: number;
  excludeProductId?: string;
  useAi?: boolean;
  contextualKeywords?: string[];
  traceId?: string;
}





const candidateSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  salePrice: true,
  stock: true,
  createdAt: true,
  brand: { select: { name: true } },
  category: { select: { name: true } },
  images: {
    where: { isPrimary: true },
    orderBy: { displayOrder: "asc" as const },
    take: 1,
    select: { imageUrl: true },
  },
  specs: {
    take: 12,
    select: {
      value: true,
      attribute: { select: { name: true } },
    },
  },
  _count: { select: { orderDetails: true } },
} as const;

type CandidateRow = Awaited<
  ReturnType<typeof prisma.product.findMany<{ select: typeof candidateSelect }>>
>[number];





const recommendationCache = new TtlCache<RecommendationResult>();

function buildCacheKey(options: RecommendationOptions): string {
  const identity = options.userId ?? options.sessionId ?? "anon";
  return `${identity}:${options.limit ?? 8}:${options.excludeProductId ?? ""}:${options.useAi ?? false}`;
}





export class RecommendationService {
  constructor(
    private readonly aiService = new RecommendationAiService(),
  ) {}

  async getRecommendations(options: RecommendationOptions): Promise<RecommendationResult> {
    const limit = Math.min(8, Math.max(1, options.limit ?? 8));


    const useCache = !options.contextualKeywords?.length;
    const cacheKey = buildCacheKey(options);

    if (useCache) {
      const cached = recommendationCache.get(cacheKey);
      if (cached) {
        appendAiTrace(options.traceId ?? "", "recommendation.cache", { hit: true });
        return { ...cached, source: "cache" };
      }
    }

    const profile = await this.buildPreferenceProfile(options.userId, options.sessionId);
    if (options.contextualKeywords?.length) {
      const contextualIntents = inferIntents(options.contextualKeywords);
      profile.keywords = options.contextualKeywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .slice(0, 20);
      if (contextualIntents.length > 0) {
        profile.intents = contextualIntents;
      }
      const contextualPrice = inferPriceRange(options.contextualKeywords);
      if (contextualPrice) {
        profile.minPrice = contextualPrice.minPrice;
        profile.maxPrice = contextualPrice.maxPrice;
      }
      profile.hasHistory = true;
    }
    const candidates = await this.getCandidates(options.excludeProductId);
    applyContextualWeights(profile, candidates, options.contextualKeywords ?? []);
    const scored = scoreCandidates(candidates, profile);
    const diversified = diversifyResults(scored, limit);
    appendAiTrace(options.traceId ?? "", "recommendation.profile", profile);
    appendAiTrace(
      options.traceId ?? "",
      "recommendation.ruleRanking",
      diversified.slice(0, 15).map((item) => ({
        productId: item.candidate.id,
        name: item.candidate.name,
        score: item.score,
        reasons: item.reasons,
      })),
    );

    if (options.useAi && profile.hasHistory) {
      const aiItems = await this.aiService.rerank(profile, diversified, limit, options.traceId);
      if (aiItems) {
        const result = {
          items: aiItems.map(({ scored: item }) =>
            toRecommendationItem(item.candidate, buildRecommendationReason(item)),
          ),
          source: "ai",
          hasHistory: true,
        } satisfies RecommendationResult;
        appendAiTrace(options.traceId ?? "", "recommendation.output", result);
        if (useCache) recommendationCache.set(cacheKey, result);
        return result;
      }
    }

    const result = {
      items: diversified.slice(0, limit).map((item) =>
        toRecommendationItem(item.candidate, buildRecommendationReason(item)),
      ),
      source: "rule-based",
      hasHistory: profile.hasHistory,
    } satisfies RecommendationResult;
    appendAiTrace(options.traceId ?? "", "recommendation.output", result);
    if (useCache) recommendationCache.set(cacheKey, result);
    return result;
  }

  async buildPreferenceProfile(
    userId: string | null,
    sessionId: string | null,
  ): Promise<UserPreferenceProfile> {
    const identityWhere = userId ? { userId } : { sessionId: sessionId! };
    const [views, searches, orders] = await Promise.all([
      prisma.productView.findMany({
        where: identityWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          product: {
            select: {
              id: true,
              price: true,
              salePrice: true,
              brand: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.searchHistory.findMany({
        where: identityWhere,
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { keyword: true },
      }),
      userId
        ? prisma.orders.findMany({
            where: {
              userId,
              status: { not: "cancelled" },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              orderDetails: {
                where: { productId: { not: null } },
                select: {
                  productId: true,
                  product: {
                    select: {
                      price: true,
                      salePrice: true,
                      brand: { select: { name: true } },
                      category: { select: { name: true } },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const brandWeights: Record<string, number> = {};
    const categoryWeights: Record<string, number> = {};
    const prices: number[] = [];
    const purchasedProductIds: string[] = [];

    for (const view of views) {
      increment(brandWeights, view.product.brand.name, 1);
      increment(categoryWeights, view.product.category.name, 1);
      prices.push(Number(view.product.salePrice ?? view.product.price));
    }

    for (const order of orders) {
      for (const detail of order.orderDetails) {
        if (!detail.product || !detail.productId) continue;
        increment(brandWeights, detail.product.brand.name, 3);
        increment(categoryWeights, detail.product.category.name, 3);
        prices.push(Number(detail.product.salePrice ?? detail.product.price));
        purchasedProductIds.push(detail.productId);
      }
    }

    const keywords = searches.map((search) => search.keyword);
    const inferredPrice = inferPriceRange(keywords);
    const averagePrice =
      prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;

    return {
      brandWeights,
      categoryWeights,
      minPrice: inferredPrice?.minPrice ?? (averagePrice ? averagePrice * 0.65 : null),
      maxPrice: inferredPrice?.maxPrice ?? (averagePrice ? averagePrice * 1.35 : null),
      keywords,
      intents: inferIntents(keywords),
      purchasedProductIds: [...new Set(purchasedProductIds)],
      hasHistory: views.length > 0 || searches.length > 0 || purchasedProductIds.length > 0,
    };
  }





  private async getCandidates(excludeProductId?: string): Promise<RecommendationCandidate[]> {
    const baseWhere = {
      isDeleted: false,
      status: "active" as const,
      stock: { gt: 0 },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      brand: { isActive: true },
      category: { isActive: true },
    };

    const [newest, popular, onSale] = await Promise.all([

      prisma.product.findMany({
        where: baseWhere,
        orderBy: [{ createdAt: "desc" }],
        take: 30,
        select: candidateSelect,
      }),

      prisma.product.findMany({
        where: baseWhere,
        orderBy: [{ orderDetails: { _count: "desc" } }],
        take: 25,
        select: candidateSelect,
      }),

      prisma.product.findMany({
        where: {
          ...baseWhere,
          salePrice: { not: null },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 15,
        select: candidateSelect,
      }),
    ]);


    const seen = new Set<string>();
    const merged: RecommendationCandidate[] = [];
    for (const product of [...newest, ...popular, ...onSale]) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      merged.push(mapToCandidate(product));
    }
    return merged;
  }
}





function increment(target: Record<string, number>, key: string, amount: number) {
  const normalizedKey = normalizeVietnamese(key);
  target[normalizedKey] = (target[normalizedKey] ?? 0) + amount;
}

function applyContextualWeights(
  profile: UserPreferenceProfile,
  candidates: RecommendationCandidate[],
  contextualKeywords: string[],
) {
  if (contextualKeywords.length === 0) return;
  const text = normalizeVietnamese(contextualKeywords.join(" "));
  const contextualIntents = inferIntents(contextualKeywords);


  if (contextualIntents.length > 0) {
    for (const category of Object.keys(profile.categoryWeights)) {
      profile.categoryWeights[category] = 0;
    }
  }

  for (const brand of new Set(candidates.map((candidate) => candidate.brand))) {
    if (text.includes(normalizeVietnamese(brand))) {
      increment(profile.brandWeights, brand, 20);
    }
  }

  const categoryBoosts: Record<string, Array<[string, number]>> = {
    gaming: [["gaming", 28]],
    creative: [["creator", 28]],
    engineering: [["creator", 28], ["gaming", 12]],
    ai: [["creator", 22], ["gaming", 18]],
    programming: [["business", 28], ["ultrabook", 28], ["student", 14]],
    office: [["business", 26], ["ultrabook", 22], ["student", 16]],
    study: [["student", 26], ["business", 20], ["ultrabook", 18]],
    portable: [["ultrabook", 30], ["business", 24]],
  };

  for (const intent of contextualIntents) {
    for (const [category, weight] of categoryBoosts[intent] ?? []) {
      profile.categoryWeights[category] = (profile.categoryWeights[category] ?? 0) + weight;
    }
  }
}

function mapToCandidate(product: CandidateRow): RecommendationCandidate {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    image: product.images[0]?.imageUrl ?? null,
    brand: product.brand.name,
    category: product.category.name,
    stock: product.stock,
    createdAt: product.createdAt,
    orderCount: product._count.orderDetails,
    specs: product.specs.map((spec) => ({
      name: spec.attribute.name,
      value: spec.value,
    })),
  };
}

function toRecommendationItem(
  candidate: RecommendationCandidate,
  reason: string,
): RecommendationItem {
  return {
    id: candidate.id,
    name: candidate.name,
    slug: candidate.slug,
    price: candidate.price,
    salePrice: candidate.salePrice,
    image: candidate.image,
    brand: candidate.brand,
    category: candidate.category,
    stock: candidate.stock,
    reason,
  };
}
