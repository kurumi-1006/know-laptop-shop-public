import prisma from '@/lib/prisma';
import { accessControl, authRoles } from '@/features/auth/lib/auth-permissions';
import { UserRole } from '@/lib/roles';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, emailOTP } from 'better-auth/plugins';
import nodemailer from 'nodemailer';
import { APIError } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { cookies } from 'next/headers';


async function assertAccountNotBanned(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { banned: true, banReason: true },
  });
  if (user?.banned) {
    throw new APIError('FORBIDDEN', {
      message: user.banReason
        ? `Tài khoản đã bị khóa: ${user.banReason}`
        : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.',
    });
  }
}

async function sendOtpEmail(email: string, otp: string) {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || `Know <${user}>`;

  if (!user || !password) {
    throw new Error(
      'Email OTP is not configured. Set SMTP_USER and SMTP_PASSWORD.',
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass: password,
    },
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: `${otp} là mã xác thực Know của bạn`,
    text: [
      'Đăng nhập vào Know',
      '',
      `Mã xác thực của bạn: ${otp}`,
      '',
      'Mã này hết hạn sau 5 phút.',
      'Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.',
      '',
      'Know',
    ].join('\n'),
    html: `
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Đăng nhập vào Know</title>
        </head>
        <body style="margin:0;background:#f6f4ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#292724;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            Sử dụng mã ${otp} để đăng nhập vào Know. Mã hết hạn sau 5 phút.
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e1d8;border-radius:16px;overflow:hidden;">
                  <tr>
                    <td style="height:6px;background:#f97316;"></td>
                  </tr>
                  <tr>
                    <td style="padding:32px 40px 12px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="width:40px;height:40px;border-radius:12px;background:#f97316;color:#ffffff;font-size:20px;font-weight:700;text-align:center;vertical-align:middle;">K</td>
                          <td style="padding-left:12px;font-size:20px;font-weight:700;color:#292724;">Know</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px 36px;">
                      <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#1f1d1a;">Xác nhận đăng nhập</h1>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b655d;">
                        Nhập mã xác thực bên dưới để đăng nhập an toàn vào tài khoản Know của bạn.
                      </p>
                      <div style="padding:22px 16px;border:1px solid #fed7aa;border-radius:12px;background:#fff7ed;text-align:center;">
                        <div style="margin-bottom:8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9a5b22;">Mã xác thực</div>
                        <div style="font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#c2410c;">${otp}</div>
                      </div>
                      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b655d;">
                        Mã này hết hạn sau <strong style="color:#292724;">5 phút</strong> và chỉ được sử dụng một lần.
                      </p>
                      <div style="margin-top:24px;padding:14px 16px;border-radius:10px;background:#f5f5f4;font-size:13px;line-height:1.55;color:#78716c;">
                        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này. Tuyệt đối không chia sẻ mã này với bất kỳ ai.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #eeeae3;padding:20px 40px;text-align:center;font-size:12px;color:#a39d94;">
                      Gửi an toàn bởi Know
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { banned: true, banReason: true },
          });
          if (user?.banned) {
            const cookieStore = await cookies();
            cookieStore.set('ban_reason', user.banReason || '', { maxAge: 60, path: '/' });
            throw new APIError('FORBIDDEN', {
              message: user.banReason
                ? `Tài khoản đã bị khóa: ${user.banReason}`
                : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.',
            });
          }
        },
      },
    },
  },

  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: async (profile) => {
        const user = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { banned: true, banReason: true },
        });
        if (user?.banned) {
          const cookieStore = await cookies();
          cookieStore.set('ban_reason', user.banReason || '', { maxAge: 60, path: '/' });
          throw new APIError('FORBIDDEN', {
            message: user.banReason
              ? `Tài khoản đã bị khóa: ${user.banReason}`
              : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.',
          });
        }
        return {
          email: profile.email,
          name: profile.name,
        };
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === '/email-otp/send-verification-otp' ||
        ctx.path === '/email-otp/verify-otp' ||
        ctx.path === '/sign-in/email-otp'
      ) {
        const email = ctx.body?.email;
        if (email) {
          await assertAccountNotBanned(email);
        }
      }
    }),
  },

  plugins: [
    admin({
      ac: accessControl,
      roles: authRoles,
      defaultRole: UserRole.customer,
      adminRoles: [UserRole.admin, UserRole.staff],
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await assertAccountNotBanned(email);
        await sendOtpEmail(email, otp);
      },
      expiresIn: 300,
      otpLength: 6,
      allowedAttempts: 3,
      storeOTP: 'hashed',
    }),
  ],
});
