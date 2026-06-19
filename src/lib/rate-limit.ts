




interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

const ROUTE_CONFIGS: Record<string, RateLimitConfig> = {
  "/api/auth": { windowMs: 60 * 1000, maxRequests: 30 },
  "/api/admin": { windowMs: 60 * 1000, maxRequests: 120 },
  "/api/orders": { windowMs: 60 * 1000, maxRequests: 20 },
  "/api/chat": { windowMs: 10 * 60 * 1000, maxRequests: 20 },
  "/api/cart": { windowMs: 60 * 1000, maxRequests: 60 },
  "/api/wishlist": { windowMs: 60 * 1000, maxRequests: 60 },
};

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 50_000;

function getConfig(pathname: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(ROUTE_CONFIGS)) {
    if (pathname.startsWith(prefix)) {
      return config;
    }
  }
  return DEFAULT_CONFIG;
}

function getClientIdentifier(request: Request): string {

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  return `${ip}:${userAgent.slice(0, 50)}`;
}

let lastGc = Date.now();
const GC_INTERVAL_MS = 5 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(request: Request): RateLimitResult {

  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/api/")) {
    return { allowed: true, remaining: -1, resetAt: 0 };
  }


  const now = Date.now();
  if (now - lastGc > GC_INTERVAL_MS && store.size > MAX_STORE_SIZE / 2) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
    lastGc = now;
  }


  if (store.size > MAX_STORE_SIZE) {
    return { allowed: false, remaining: 0, resetAt: now + 60_000 };
  }

  const config = getConfig(pathname);
  const key = getClientIdentifier(request);
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}
