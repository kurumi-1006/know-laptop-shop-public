import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { RouteAccessFacade } from "@/features/auth/lib/route-access";

const routeAccess = new RouteAccessFacade();





const CSRF_EXEMPT_PATHS = [
  "/api/payments/stripe/webhook",
  "/api/auth",
];





const RATE_LIMIT_EXEMPT_PATHS = [
  "/api/auth/get-session",
];




function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) {




    return false;
  }

  const requestHost = request.headers.get("host") ?? "";
  const requestOrigin = new URL(request.url).origin;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === requestHost || originUrl.origin === requestOrigin;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === requestHost || refererUrl.origin === requestOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

function isStateChangingMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  if (pathname.startsWith("/api/")) {

    const isRateLimitExempt = RATE_LIMIT_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    const rateLimitResult = isRateLimitExempt
      ? { allowed: true, remaining: -1, resetAt: 0 }
      : checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
            "X-RateLimit-Limit": "rate-limited",
          },
        },
      );
    }


    if (isStateChangingMethod(request.method)) {
      const isExempt = CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
      if (!isExempt && !isSameOrigin(request)) {
        return NextResponse.json(
          { error: "Yêu cầu không hợp lệ (CSRF)." },
          { status: 403 },
        );
      }
    }

    const response = NextResponse.next();


    if (rateLimitResult.remaining >= 0) {
      response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
      response.headers.set("X-RateLimit-Reset", String(rateLimitResult.resetAt));
    }


    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  }


  return routeAccess.authorize(request);
}

export const config = {
  matcher: [

    "/api/:path*",

    "/address/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/dashboard/:path*",
    "/login/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
  ],
};
