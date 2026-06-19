import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { FeedbackFacade } from "@/features/feedback/lib/feedback";
import { safeParseInt } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = safeParseInt(searchParams.get("page"), 1);
    const pageSize = safeParseInt(searchParams.get("pageSize"), 10);
    const search = searchParams.get("search") ?? "";
    const rating = searchParams.get("rating") ?? "all";
    const status = searchParams.get("status") ?? "all";

    const { data: feedbacks, total, stats } = await FeedbackFacade.getFeedbacksList({ page, pageSize, search, rating, status });

    return NextResponse.json({
      data: feedbacks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("List feedbacks failed", error);
    return NextResponse.json({ error: "Unable to list feedbacks." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const { feedbackId, isVisible } = await request.json();

    if (!feedbackId || typeof feedbackId !== "string") {
      return NextResponse.json({ error: "Invalid feedback ID" }, { status: 400 });
    }

    const updatedFeedback = await FeedbackFacade.setVisibility(feedbackId, !!isVisible);

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Update feedback visibility failed", error);
    return NextResponse.json({ error: "Unable to update feedback visibility." }, { status: 500 });
  }
}
