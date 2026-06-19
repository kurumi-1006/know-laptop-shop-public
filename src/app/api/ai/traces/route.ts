import { auth } from "@/features/auth/lib/auth";
import {
  getAiTracesForUser,
  isAiTraceEnabled,
} from "@/features/chat/lib/ai-trace";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!isAiTraceEnabled()) {
    return NextResponse.json({
      enabled: false,
      message: "Đặt AI_TRACE_ENABLED=true và khởi động lại server để xem trace.",
      traces: [],
    });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 });
  }

  return NextResponse.json({
    enabled: true,
    traces: getAiTracesForUser(session.user.id, parsed.data.limit),
  });
}
