import { auth } from '@/features/auth/lib/auth';
import prisma from '@/lib/prisma';
import { toNextJsHandler } from 'better-auth/next-js';
import { cookies } from 'next/headers';

const handler = toNextJsHandler(auth);

export async function POST(request: Request) {
  const response = await handler.POST(request);
  return revokeSessionIfBanned(request, response);
}

export async function GET(request: Request) {
  try {
    const response = await handler.GET(request);
    const url = new URL(request.url);


    const isRedirect = response.status >= 300 && response.status < 400;
    if (url.pathname.includes('/callback/') && !isRedirect) {
      const clone = response.clone();
      let errorMessage = 'Đăng nhập không thành công.';
      try {
        const text = await clone.text();
        const json = JSON.parse(text);
        errorMessage = json.message || json.error || errorMessage;
      } catch {

      }

      const loginUrl = new URL(
        `/login?error=${encodeURIComponent(errorMessage)}`,
        request.url,
      );
      return Response.redirect(loginUrl.toString(), 302);
    }


    const redirectLocation = response.headers.get('location');
    if (redirectLocation) {
      const redirectUrl = new URL(redirectLocation, request.url);
      if (redirectUrl.pathname === '/login' && redirectUrl.searchParams.has('error')) {
        const errorVal = redirectUrl.searchParams.get('error');
        if (errorVal === 'Forbidden' || errorVal === 'FORBIDDEN' || errorVal === 'unknown') {
          const cookieStore = await cookies();
          const banReason = cookieStore.get('ban_reason')?.value;

          let message = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.';
          if (banReason) {
            message = `Tài khoản đã bị khóa: ${banReason}`;
          }


          cookieStore.delete('ban_reason');

          redirectUrl.searchParams.set('error', message);

          const newResponse = Response.redirect(redirectUrl.toString(), 302);

          response.headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'location') {
              newResponse.headers.append(key, value);
            }
          });
          return newResponse;
        }
      }
    }

    return revokeSessionIfBanned(request, response);
  } catch (error) {
    console.error("Auth GET error:", error);

    if (error && typeof error === 'object' && 'status' in error && error.status === 'FORBIDDEN') {
      const message = (error as any).message || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.';
      const loginUrl = new URL(
        `/login?error=${encodeURIComponent(message)}`,
        request.url,
      );
      return Response.redirect(loginUrl.toString(), 302);
    }
    throw error;
  }
}

function extractSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
  return match ? match[1] : null;
}

async function revokeSessionIfBanned(request: Request, response: Response) {
  const url = new URL(request.url);

  let sessionToken: string | null = null;


  if (url.pathname.includes('/callback/')) {
    sessionToken = extractSessionToken(response.headers.get('set-cookie'));
  } else {

    sessionToken = extractSessionToken(request.headers.get('cookie'));
  }

  if (!sessionToken) return response;

  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: { select: { id: true, banned: true, banReason: true } },
      },
    });

    if (session?.user?.banned) {
      await prisma.session.deleteMany({
        where: { userId: session.user.id },
      });

      const message = session.user.banReason
        ? `Tài khoản đã bị khóa: ${session.user.banReason}`
        : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.';

      const loginUrl = new URL(
        `/login?error=${encodeURIComponent(message)}`,
        request.url,
      );
      const errorResponse = Response.redirect(loginUrl, 302);
      errorResponse.headers.set(
        'set-cookie',
        'better-auth.session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      );
      return errorResponse;
    }
  } catch {

  }

  return response;
}
