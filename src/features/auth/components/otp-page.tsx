'use client';

import { FloatingPaths } from '@/components/shared/floating-paths';
import { LogoIcon } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authClient } from '@/features/auth/lib/auth-client';
import { otpSchema, type OtpValues } from '@/features/auth/schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

const RESEND_COOLDOWN_SECONDS = 30;

function Brand() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-wide">
      <LogoIcon className="h-10 w-auto" />
      <span>Know</span>
    </div>
  );
}

export function OtpPage({ email, redirectTo }: { email: string; redirectTo: string }) {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const form = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((countdown) => Math.max(0, countdown - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const verifyOtp = form.handleSubmit(async ({ otp }) => {
    try {
      const { error } = await authClient.signIn.emailOtp({ email, otp });

      if (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('hết hạn')) {
          toast.error('Mã xác minh đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
        } else if (msg.toLowerCase().includes('attempt') || msg.toLowerCase().includes('lần thử')) {
          toast.error('Bạn đã nhập sai quá số lần cho phép. Vui lòng yêu cầu gửi lại mã mới.');
        } else if (msg.toLowerCase().includes('khóa') || msg.toLowerCase().includes('banned')) {
          toast.error(msg);
        } else {
          toast.error('Mã xác minh không chính xác. Vui lòng kiểm tra lại.');
        }
        return;
      }

      toast.success('Đăng nhập thành công.');
      router.replace(redirectTo);
      router.refresh();
    } catch {
      toast.error('Không thể kết nối đến dịch vụ đăng nhập. Vui lòng thử lại.');
    }
  });

  const resendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('khóa') || msg.toLowerCase().includes('banned')) {
          toast.error(msg);
        } else {
          toast.error(msg || 'Không thể gửi lại mã. Vui lòng thử lại sau.');
        }
        return;
      }

      form.reset();
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      toast.success('Mã xác minh mới đã được gửi.');
    } catch {
      toast.error('Không thể kết nối đến dịch vụ đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <div className="z-10 mr-auto">
          <Brand />
        </div>
        <div className="z-10 mt-auto">
          <blockquote className="flex flex-col gap-2">
            <p className="text-xl">
              &ldquo;Trải nghiệm mua sắm hiện đại, đơn giản và đáng tin cậy.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold">Know</footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8">
        <div aria-hidden className="absolute inset-0 isolate -z-10 opacity-60 contain-strict">
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,--theme(--color-foreground/.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <Button asChild className="absolute top-7 left-5" variant="ghost">
          <Link href="/login">
            <ChevronLeftIcon data-icon="inline-start" />
            Quay lại
          </Link>
        </Button>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-wide">Kiểm tra email của bạn</h1>
            <p className="text-sm text-muted-foreground">
              Nhập mã 6 chữ số đã gửi đến <strong>{email}</strong>.
            </p>
          </div>

          <form className="flex flex-col gap-3" onSubmit={verifyOtp}>
            <Controller
              control={form.control}
              name="otp"
              render={({ field }) => (
                <InputOTP
                  aria-label="Verification code"
                  autoComplete="one-time-code"
                  autoFocus
                  containerClassName="justify-center"
                  maxLength={6}
                  onChange={field.onChange}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.value}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot className="size-11 text-lg" index={index} key={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {form.formState.errors.otp && (
              <p className="text-center text-xs text-destructive">
                {form.formState.errors.otp.message}
              </p>
            )}

            <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Đang xác minh...' : 'Xác minh và Đăng nhập'}
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs">
            <Button asChild className="h-auto px-0" variant="link">
              <Link href="/login">Đổi email</Link>
            </Button>
            <Button
              className="h-auto px-0"
              disabled={form.formState.isSubmitting || isResending || resendCountdown > 0}
              onClick={resendOtp}
              type="button"
              variant="link"
            >
              {isResending
                ? 'Đang gửi...'
                : resendCountdown > 0
                  ? `Gửi lại mã sau ${resendCountdown}s`
                  : 'Gửi lại mã'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">Mã xác minh hết hạn sau 5 phút.</p>
        </div>
      </div>
    </main>
  );
}
