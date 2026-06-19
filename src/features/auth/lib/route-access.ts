import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_ROUTES, CUSTOMER_ROUTES, ROUTES } from "@/lib/constants";

type AccessUser = {
  role: string;
};

type AccessSession = {
  user: AccessUser;
};

type AccessContext = {
  request: NextRequest;
  pathname: string;
  session: AccessSession | null;
};

type AccessDecision = NextResponse | null;

interface AccessPolicy {
  setNext(policy: AccessPolicy): AccessPolicy;
  evaluate(context: AccessContext): AccessDecision;
}

abstract class BaseAccessPolicy implements AccessPolicy {
  private nextPolicy: AccessPolicy | null = null;

  setNext(policy: AccessPolicy) {
    this.nextPolicy = policy;
    return policy;
  }

  evaluate(context: AccessContext): AccessDecision {
    return this.nextPolicy?.evaluate(context) ?? null;
  }
}

class AuthenticationPolicy extends BaseAccessPolicy {
  override evaluate(context: AccessContext) {
    if (context.session) return super.evaluate(context);
    if (isAuthRoute(context.pathname)) return NextResponse.next();

    const loginUrl = new URL(ROUTES.login, context.request.url);
    loginUrl.searchParams.set("redirect", context.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

class AuthRoutePolicy extends BaseAccessPolicy {
  override evaluate(context: AccessContext) {
    if (!isAuthRoute(context.pathname) || !context.session) {
      return super.evaluate(context);
    }

    const destination =
      context.session.user.role === "customer" ? ROUTES.home : ROUTES.dashboard;
    return NextResponse.redirect(new URL(destination, context.request.url));
  }
}

class DashboardPolicy extends BaseAccessPolicy {
  override evaluate(context: AccessContext) {
    if (
      context.pathname.startsWith(ROUTES.dashboard) &&
      context.session?.user.role === "customer"
    ) {
      return NextResponse.redirect(new URL(ROUTES.home, context.request.url));
    }

    return super.evaluate(context);
  }
}

class CustomerAreaPolicy extends BaseAccessPolicy {
  override evaluate(context: AccessContext) {
    if (
      isCustomerRoute(context.pathname) &&
      context.session?.user.role !== "customer"
    ) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, context.request.url));
    }

    return super.evaluate(context);
  }
}

class BetterAuthSessionAdapter {
  static async fromRequest(request: NextRequest): Promise<AccessSession | null> {
    const cookie = request.headers.get("cookie") ?? "";
    const hasSessionCookie =
      cookie.includes("better-auth.session_token") ||
      cookie.includes("__Secure-better-auth.session_token");

    if (!hasSessionCookie) return null;

    try {
      const { default: axios } = await import("axios");
      const { data: session } = await axios.get<{
        user?: { role?: unknown };
      } | null>(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: { cookie },
      });

      if (!session?.user || typeof session.user.role !== "string") return null;

      return { user: { role: session.user.role } };
    } catch {
      return null;
    }
  }
}

export class RouteAccessFacade {
  private readonly policyChain: AccessPolicy;

  constructor() {
    const authentication = new AuthenticationPolicy();
    authentication
      .setNext(new AuthRoutePolicy())
      .setNext(new DashboardPolicy())
      .setNext(new CustomerAreaPolicy());
    this.policyChain = authentication;
  }

  async authorize(request: NextRequest) {
    const session = await BetterAuthSessionAdapter.fromRequest(request);
    const decision = this.policyChain.evaluate({
      request,
      pathname: request.nextUrl.pathname,
      session,
    });

    return decision ?? NextResponse.next();
  }
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isCustomerRoute(pathname: string) {
  return CUSTOMER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
