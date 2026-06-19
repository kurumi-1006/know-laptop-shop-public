'use client';

import { GoogleIcon } from '@/components/icons/google-icon';
import { FloatingPaths } from '@/components/shared/floating-paths';
import { LogoIcon } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { AuthDivider } from '@/features/auth/components/auth-divider';
import { authClient } from '@/features/auth/lib/auth-client';
import { emailSignInSchema, type EmailSignInValues } from '@/features/auth/schemas/auth';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSignIcon, ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

function Brand() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-wide">
      <LogoIcon className="h-10 w-auto" />
      <span>Know</span>
    </div>
  );
}

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('redirect'));
  const [isGooglePending, setIsGooglePending] = useState(false);
  const form = useForm<EmailSignInValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: { email: '' },
  });

  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));

      const params = new URLSearchParams(searchParams.toString());
      params.delete('error');
      const newQuery = params.toString();
      const cleanPath = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
      window.history.replaceState({}, '', cleanPath);
    }
  }, [errorParam, searchParams]);

  const signInWithGoogle = async () => {
    setIsGooglePending(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo,
        errorCallbackURL: '/login',
      });

      if (error) {
        toast.error(error.message || 'Không thể đăng nhập bằng Google.');
        setIsGooglePending(false);
      }
    } catch {
      toast.error('Không thể kết nối đến dịch vụ đăng nhập.');
      setIsGooglePending(false);
    }
  };

  const continueWithEmail = form.handleSubmit(async ({ email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: 'sign-in',
      });

      if (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('khóa') || msg.toLowerCase().includes('banned')) {
          toast.error(msg);
        } else if (
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('không tồn tại')
        ) {
          toast.error('Email này chưa được đăng ký. Vui lòng kiểm tra lại hoặc tạo tài khoản mới.');
        } else {
          toast.error(msg || 'Không thể gửi mã xác minh. Vui lòng thử lại sau.');
        }
        return;
      }

      toast.success('Mã xác minh đã được gửi đến email của bạn.');
      const otpUrl = `/login/otp?email=${encodeURIComponent(normalizedEmail)}`;
      router.push(
        redirectTo !== '/' ? `${otpUrl}&redirect=${encodeURIComponent(redirectTo)}` : otpUrl,
      );
    } catch {
      toast.error('Không thể kết nối đến dịch vụ đăng nhập. Vui lòng kiểm tra kết nối mạng.');
    }
  });

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
          <Link href="/">
            <ChevronLeftIcon data-icon="inline-start" />
            Trang chủ
          </Link>
        </Button>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-wide">Chào mừng trở lại</h1>
            <p className="text-base text-muted-foreground">Đăng nhập để tiếp tục vào Know.</p>
          </div>

          <Button
            className="w-full"
            disabled={isGooglePending || form.formState.isSubmitting}
            onClick={signInWithGoogle}
          >
            <GoogleIcon data-icon="inline-start" />
            {isGooglePending ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}
          </Button>

          <AuthDivider>HOẶC</AuthDivider>

          <form className="flex flex-col gap-2" onSubmit={continueWithEmail}>
            <p className="text-start text-xs text-muted-foreground">
              Nhập email để đăng nhập hoặc tạo tài khoản
            </p>

            <InputGroup>
              <InputGroupInput
                autoComplete="email"
                placeholder="your.email@example.com"
                type="email"
                {...form.register('email')}
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon />
              </InputGroupAddon>
            </InputGroup>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}

            <Button
              className="w-full"
              disabled={form.formState.isSubmitting || isGooglePending}
              type="submit"
            >
              {form.formState.isSubmitting ? 'Đang gửi mã...' : 'Tiếp tục với Email'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Đăng nhập để tiếp tục trải nghiệm mua sắm tại Know.
          </p>
        </div>
      </div>
    </main>
  );
}
