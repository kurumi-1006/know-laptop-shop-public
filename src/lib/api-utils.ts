



import { NextResponse } from "next/server";





export function withErrorHandler<T extends readonly unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      console.error("API route error:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}




export function safeParseInt(value: string | null | undefined, defaultValue: number = 1): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) return defaultValue;
  return num;
}




export function safeParseFloat(value: string | null | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  return num;
}




export function unauthorized(message = "Bạn cần đăng nhập để tiếp tục.") {
  return NextResponse.json({ error: "UNAUTHORIZED", message }, { status: 401 });
}




export function forbidden(message = "Bạn không có quyền truy cập.") {
  return NextResponse.json({ error: "FORBIDDEN", message }, { status: 403 });
}




export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}




export function notFound(message = "Không tìm thấy.") {
  return NextResponse.json({ error: message }, { status: 404 });
}
