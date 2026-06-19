import { describe, expect, it } from "vitest";
import {
  buildRecommendationReason,
  inferIntents,
  inferPriceRange,
  scoreCandidates,
} from "../lib/recommendation-scorer";
import type {
  RecommendationCandidate,
  UserPreferenceProfile,
} from "../lib/recommendation.types";

const baseProfile: UserPreferenceProfile = {
  brandWeights: {},
  categoryWeights: {},
  minPrice: null,
  maxPrice: null,
  keywords: [],
  intents: [],
  purchasedProductIds: [],
  hasHistory: true,
};

function candidate(
  overrides: Partial<RecommendationCandidate>,
): RecommendationCandidate {
  return {
    id: "product-1",
    name: "Laptop mẫu",
    slug: "laptop-mau",
    description: null,
    price: 20_000_000,
    salePrice: null,
    image: null,
    brand: "ASUS",
    category: "Laptop",
    stock: 10,
    createdAt: new Date(),
    orderCount: 0,
    specs: [],
    ...overrides,
  };
}

describe("recommendation scorer", () => {
  it("suy ra nhu cầu gaming và tầm giá dưới 25 triệu", () => {
    const keywords = ["laptop gaming RTX 4050 dưới 25 triệu"];

    expect(inferIntents(keywords)).toContain("gaming");
    expect(inferPriceRange(keywords)).toEqual({
      minPrice: null,
      maxPrice: 25_000_000,
    });
  });

  it("hiểu khoảng giá và nhu cầu lập trình", () => {
    const keywords = ["laptop lập trình Docker từ 20 đến 30 triệu"];

    expect(inferIntents(keywords)).toContain("programming");
    expect(inferPriceRange(keywords)).toEqual({
      minPrice: 20_000_000,
      maxPrice: 30_000_000,
    });
  });

  it("ưu tiên laptop gaming khớp RTX và tầm giá", () => {
    const gaming = candidate({
      id: "gaming",
      name: "ASUS TUF Gaming RTX 4050",
      price: 24_000_000,
      category: "Gaming",
      specs: [
        { name: "Graphics", value: "NVIDIA GeForce RTX 4050" },
        { name: "Memory", value: "16GB" },
      ],
    });
    const office = candidate({
      id: "office",
      name: "Laptop văn phòng",
      price: 18_000_000,
      brand: "Dell",
      category: "Business",
      specs: [{ name: "Graphics", value: "Intel UHD" }],
    });
    const profile: UserPreferenceProfile = {
      ...baseProfile,
      categoryWeights: { gaming: 3 },
      minPrice: null,
      maxPrice: 25_000_000,
      keywords: ["gaming RTX 4050 dưới 25 triệu"],
      intents: ["gaming"],
    };

    const ranked = scoreCandidates([office, gaming], profile);

    expect(ranked[0].candidate.id).toBe("gaming");
    expect(buildRecommendationReason(ranked[0])).toContain("Phù hợp vì");
  });

  it("giảm điểm sản phẩm user vừa mua", () => {
    const purchased = candidate({ id: "purchased", orderCount: 10 });
    const alternative = candidate({ id: "alternative", orderCount: 2 });
    const profile: UserPreferenceProfile = {
      ...baseProfile,
      purchasedProductIds: ["purchased"],
    };

    const ranked = scoreCandidates([purchased, alternative], profile);

    expect(ranked[0].candidate.id).toBe("alternative");
  });

  it("fallback ưu tiên sản phẩm bán chạy, mới hoặc giảm giá", () => {
    const popular = candidate({ id: "popular", orderCount: 20 });
    const plain = candidate({
      id: "plain",
      createdAt: new Date("2020-01-01"),
      orderCount: 0,
    });
    const profile: UserPreferenceProfile = {
      ...baseProfile,
      hasHistory: false,
    };

    const ranked = scoreCandidates([plain, popular], profile);

    expect(ranked[0].candidate.id).toBe("popular");
    expect(buildRecommendationReason(ranked[0])).toContain("nhiều khách hàng");
  });
});
