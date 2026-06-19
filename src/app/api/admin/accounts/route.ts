import {
  AccountAccessError,
  AccountManagementFacade,
} from "@/features/admin/lib/account-facade";
import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";

async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  const facade = new AccountManagementFacade();

  try {
    const query = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await facade.list(session?.user, query), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    return accountErrorResponse(error);
  }
}

function accountErrorResponse(error: unknown) {
  if (error instanceof AccountAccessError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  console.error("Account request failed", error);
  return NextResponse.json(
    { error: "Unable to process account request." },
    { status: 500 },
  );
}
