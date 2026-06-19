import { auth } from "@/features/auth/lib/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { NextResponse } from "next/server";
import { hasRole } from "@/lib/roles";

export class ForbiddenError extends Error {
  constructor(message = "Bạn không có quyền truy cập") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Bạn cần đăng nhập để tiếp tục") {
    super(message);
    this.name = "UnauthorizedError";
  }
}





export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session.user;
}




export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);
  if (!hasRole(user.role, [UserRole.admin])) {
    throw new ForbiddenError();
  }
  return user;
}




export async function requireStaff(request: Request) {
  const user = await requireAuth(request);
  if (!hasRole(user.role, [UserRole.admin, UserRole.staff])) {
    throw new ForbiddenError();
  }
  return user;
}




export function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: "FORBIDDEN", message: error.message }, { status: 403 });
  }
  return null;
}
