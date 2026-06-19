import type {
  RecommendationCandidate,
  ScoredRecommendation,
  UserPreferenceProfile,
} from "./recommendation.types";
import { normalizeVietnamese } from "@/lib/normalize-text";

const INTENT_KEYWORDS: Record<string, string[]> = {
  gaming: ["gaming", "game", "rtx", "gtx", "geforce", "card roi", "gpu"],
  office: ["van phong", "office", "hoc tap", "sinh vien", "business"],
  creative: ["do hoa", "render", "adobe", "thiet ke", "creator"],
  portable: ["pin", "mong nhe", "di dong", "ultrabook", "nhe"],
  budget: ["re", "gia re", "tiet kiem"],
  programming: ["programming", "lap trinh", "coding", "developer", "docker", "may ao", "linux"],
  engineering: ["autocad", "revit", "solidworks", "cad", "ky thuat"],
  ai: ["machine learning", "deep learning", "data science", "cuda", "tri tue nhan tao"],
};

export function inferIntents(keywords: string[]) {
  const text = normalize(keywords.join(" "));
  return Object.entries(INTENT_KEYWORDS)
    .filter(([, terms]) => terms.some((term) => text.includes(normalize(term))))
    .map(([intent]) => intent);
}

export function inferPriceRange(keywords: string[]) {
  const text = normalize(keywords.join(" "));
  const rangeMatch = text.match(
    /\b(?:từ|tu|khoảng|khoang)?\s*(\d{1,3})\s*(?:đến|den|-)\s*(\d{1,3})\s*(?:triệu|trieu|tr)\b/,
  );
  if (rangeMatch) {
    return {
      minPrice: Number(rangeMatch[1]) * 1_000_000,
      maxPrice: Number(rangeMatch[2]) * 1_000_000,
    };
  }

  const matches = [
    ...text.matchAll(
      /\b(dưới|duoi|trên|tren|từ|tu)?\s*(\d{1,3})(?:[.,](\d))?\s*(?:triệu|trieu|tr)\b/g,
    ),
  ];
  const amountMatch = matches.at(-1);

  if (!amountMatch) return null;

  const amount =
    (Number(amountMatch[2]) + Number(`0.${amountMatch[3] ?? 0}`)) * 1_000_000;
  const operator = amountMatch[1] ?? "dưới";

  if (operator === "trên" || operator === "tren" || operator === "từ" || operator === "tu") {
    return { minPrice: amount, maxPrice: null };
  }

  return { minPrice: null, maxPrice: amount };
}

export function scoreCandidates(
  candidates: RecommendationCandidate[],
  profile: UserPreferenceProfile,
): ScoredRecommendation[] {
  return candidates
    .map((candidate) => scoreCandidate(candidate, profile))
    .sort((a, b) => b.score - a.score || b.candidate.createdAt.getTime() - a.candidate.createdAt.getTime());
}








export function diversifyResults(
  scored: ScoredRecommendation[],
  limit: number,
): ScoredRecommendation[] {
  const maxPerBrand = Math.max(2, Math.ceil(limit * 0.5));
  const maxPerCategory = Math.max(3, Math.ceil(limit * 0.6));

  const brandCount: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};
  const result: ScoredRecommendation[] = [];
  const deferred: ScoredRecommendation[] = [];

  for (const item of scored) {
    if (result.length >= limit) break;

    const brand = item.candidate.brand.toLowerCase();
    const category = item.candidate.category.toLowerCase();
    const brandOk = (brandCount[brand] ?? 0) < maxPerBrand;
    const categoryOk = (categoryCount[category] ?? 0) < maxPerCategory;

    if (brandOk && categoryOk) {
      result.push(item);
      brandCount[brand] = (brandCount[brand] ?? 0) + 1;
      categoryCount[category] = (categoryCount[category] ?? 0) + 1;
    } else {
      deferred.push(item);
    }
  }

  for (const item of deferred) {
    if (result.length >= limit) break;
    result.push(item);
  }

  return result;
}

function scoreCandidate(
  candidate: RecommendationCandidate,
  profile: UserPreferenceProfile,
): ScoredRecommendation {
  const reasons: string[] = [];
  let score = 0;
  const searchableText = normalize(
    [
      candidate.name,
      candidate.description ?? "",
      candidate.brand,
      candidate.category,
      ...candidate.specs.flatMap((spec) => [spec.name, spec.value]),
    ].join(" "),
  );

  const brandWeight = profile.brandWeights[normalize(candidate.brand)] ?? 0;
  if (brandWeight > 0) {
    score += Math.min(10, 4 + brandWeight * 2);
    reasons.push(`bạn quan tâm thương hiệu ${candidate.brand}`);
  }

  const categoryWeight = profile.categoryWeights[normalize(candidate.category)] ?? 0;
  if (categoryWeight > 0) {
    score += Math.min(15, 6 + categoryWeight * 3);
    reasons.push(`phù hợp nhóm ${candidate.category}`);
  }

  const effectivePrice = candidate.salePrice ?? candidate.price;
  if (isWithinPriceRange(effectivePrice, profile.minPrice, profile.maxPrice)) {
    score += 15;
    reasons.push("đúng tầm giá bạn quan tâm");
  }

  const matchedKeywords = profile.keywords.filter((keyword) =>
    keywordTerms(keyword).some((term) => searchableText.includes(term)),
  );
  if (matchedKeywords.length > 0) {
    score += Math.min(40, 20 + (matchedKeywords.length - 1) * 5);
    reasons.push(`khớp tìm kiếm “${matchedKeywords[0]}”`);
  }

  const matchedIntent = profile.intents.find((intent) =>
    candidateMatchesIntent(searchableText, intent),
  );
  if (matchedIntent) {
    score += matchedIntent === "gaming" || matchedIntent === "creative" ? 20 : 15;
    reasons.push(intentReason(matchedIntent));
  }

  const prioritizesMobility =
    profile.intents.includes("portable") &&
    !profile.intents.some((intent) => ["gaming", "creative", "engineering", "ai"].includes(intent));
  if (prioritizesMobility && normalize(candidate.category) === "gaming") {
    score -= 25;
  }

  score += Math.min(15, Math.log2(candidate.orderCount + 1) * 4);

  const ageInDays = (Date.now() - candidate.createdAt.getTime()) / 86_400_000;
  if (ageInDays <= 90) score += 5;
  if (candidate.salePrice !== null && candidate.salePrice < candidate.price) score += 5;

  if (profile.purchasedProductIds.includes(candidate.id)) {
    score -= 35;
  }

  if (!profile.hasHistory) {
    reasons.length = 0;
    if (candidate.orderCount > 0) reasons.push("đang được nhiều khách hàng lựa chọn");
    if (ageInDays <= 90) reasons.push("là sản phẩm mới");
    if (candidate.salePrice !== null && candidate.salePrice < candidate.price) {
      reasons.push("đang có giá ưu đãi");
    }
  }

  return { candidate, score, reasons };
}

export function buildRecommendationReason(scored: ScoredRecommendation) {
  const reasons = scored.reasons.slice(0, 2);
  if (reasons.length === 0) {
    return "Sản phẩm còn hàng, cấu hình và mức giá phù hợp để bạn tham khảo.";
  }

  return `Phù hợp vì ${reasons.join(" và ")}.`;
}

function candidateMatchesIntent(text: string, intent: string) {
  const intentTerms: Record<string, string[]> = {
    gaming: ["gaming", "rtx", "gtx", "geforce", "radeon", "gpu"],
    office: ["business", "office", "van phong", "core i5", "ryzen 5", "8gb", "16gb"],
    creative: ["creator", "rtx", "geforce", "radeon", "16gb", "32gb", "core i7", "ryzen 7"],
    portable: ["ultrabook", "mong", "nhe", "battery", "pin"],
    budget: [],
    programming: ["16gb", "32gb", "core i7", "ryzen 7", "linux", "operating system"],
    engineering: ["rtx", "geforce", "radeon", "16gb", "32gb", "core i7", "ryzen 7"],
    ai: ["rtx", "geforce", "cuda", "32gb", "64gb"],
  };

  return (intentTerms[intent] ?? []).some((term) => text.includes(normalizeVietnamese(term)));
}

function intentReason(intent: string) {
  const reasons: Record<string, string> = {
    gaming: "cấu hình phù hợp nhu cầu gaming",
    office: "hợp cho học tập và công việc văn phòng",
    creative: "ưu tiên hiệu năng cho đồ họa và sáng tạo",
    portable: "phù hợp nhu cầu di động, mỏng nhẹ",
    budget: "có mức giá dễ tiếp cận",
    programming: "phù hợp lập trình, Docker và máy ảo",
    engineering: "có cấu hình phù hợp phần mềm kỹ thuật",
    ai: "ưu tiên GPU và RAM cho tác vụ AI",
  };
  return reasons[intent] ?? "phù hợp nhu cầu gần đây";
}

function isWithinPriceRange(price: number, minPrice: number | null, maxPrice: number | null) {
  if (minPrice !== null && price < minPrice) return false;
  if (maxPrice !== null && price > maxPrice) return false;
  return minPrice !== null || maxPrice !== null;
}

function keywordTerms(keyword: string) {
  const stopWords = new Set([
    "laptop",
    "máy",
    "tính",
    "cho",
    "tôi",
    "cần",
    "gợi",
    "khoảng",
    "đến",
    "triệu",
    "ram",
    "pin",
    "lâu",
    "và",
    "để",
  ]);

  return normalize(keyword)
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !stopWords.has(term));
}

function normalize(value: string) {
  return normalizeVietnamese(value);
}
