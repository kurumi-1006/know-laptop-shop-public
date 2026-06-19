import {
  AccountAccessError,
  AccountManagementFacade,
} from "@/features/admin/lib/account-facade";
import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  const facade = new AccountManagementFacade();

  try {
    const { userId } = await params;
    return NextResponse.json(await facade.getDetail(session?.user, userId), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    if (error instanceof AccountAccessError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    console.error("Account detail request failed", error);
    return NextResponse.json(
      { error: "Unable to process account request." },
      { status: 500 },
    );
  }
}
