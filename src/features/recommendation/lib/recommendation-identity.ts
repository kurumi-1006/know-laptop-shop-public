import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";

const RECOMMENDATION_SESSION_COOKIE = "know_recommendation_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface RecommendationIdentity {
  userId: string | null;
  sessionId: string | null;
  isNewSession: boolean;
}

export async function getRecommendationIdentity(
  request: Request,
): Promise<RecommendationIdentity> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (session?.user?.id) {
    return {
      userId: session.user.id,
      sessionId: null,
      isNewSession: false,
    };
  }

  const existingSessionId = readCookie(
    request.headers.get("cookie"),
    RECOMMENDATION_SESSION_COOKIE,
  );

  if (existingSessionId) {
    return {
      userId: null,
      sessionId: existingSessionId,
      isNewSession: false,
    };
  }

  return {
    userId: null,
    sessionId: crypto.randomUUID(),
    isNewSession: true,
  };
}

export function attachRecommendationSessionCookie(
  response: NextResponse,
  identity: RecommendationIdentity,
) {
  if (!identity.isNewSession || !identity.sessionId) return response;

  response.cookies.set(RECOMMENDATION_SESSION_COOKIE, identity.sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

export function buildIdentityWhere(identity: RecommendationIdentity) {
  return identity.userId
    ? { userId: identity.userId }
    : { sessionId: identity.sessionId! };
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) {
      const value = decodeURIComponent(rawValue.join("="));
      return value.length >= 16 && value.length <= 100 ? value : null;
    }
  }

  return null;
}
