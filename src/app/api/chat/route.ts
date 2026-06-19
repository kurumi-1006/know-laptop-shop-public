import { auth } from "@/features/auth/lib/auth";
import { ChatFacade } from "@/features/chat/lib/chat-facade";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập để sử dụng chatbot" },
      { status: 401 }
    );
  }

  return new ChatFacade().handle(request, session.user.id);
}
