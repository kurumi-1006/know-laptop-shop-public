export type RecommendationSource = "rule-based" | "ai" | "cache";

export interface UserPreferenceProfile {
  brandWeights: Record<string, number>;
  categoryWeights: Record<string, number>;
  minPrice: number | null;
  maxPrice: number | null;
  keywords: string[];
  intents: string[];
  purchasedProductIds: string[];
  hasHistory: boolean;
}

export interface RecommendationCandidate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string | null;
  brand: string;
  category: string;
  stock: number;
  createdAt: Date;
  orderCount: number;
  specs: Array<{ name: string; value: string }>;
}

export interface RecommendationItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  brand: string;
  category: string;
  stock: number;
  reason: string;
}

export interface RecommendationResult {
  items: RecommendationItem[];
  source: RecommendationSource;
  hasHistory: boolean;
}

export interface ScoredRecommendation {
  candidate: RecommendationCandidate;
  score: number;
  reasons: string[];
}
