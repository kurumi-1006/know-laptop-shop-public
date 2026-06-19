import { auth } from "@/features/auth/lib/auth";
import {
  ProfileAccessError,
  ProfileFacade,
} from "@/features/profile/lib/profile-facade";
import { NextResponse } from "next/server";

async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  const facade = new ProfileFacade();

  try {
    facade.assertCustomer(session?.user);
    return privateJson(await facade.getProfile(session!.user));
  } catch (error) {
    return profileErrorResponse(error);
  }
}

function profileErrorResponse(error: unknown) {
  if (error instanceof ProfileAccessError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  console.error("Profile request failed", error);
  return NextResponse.json(
    { error: "Unable to process profile request" },
    { status: 500 },
  );
}

function privateJson(data: unknown) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
