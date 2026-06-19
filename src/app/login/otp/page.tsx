import { OtpPage } from '@/features/auth/components/otp-page';
import { getSafeRedirect } from '@/lib/safe-redirect';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Verify email | Know',
  description: 'Enter the verification code sent to your email to sign in.',
};

export default async function EmailOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; redirect?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <EmailOtpContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EmailOtpContent({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; redirect?: string }>;
}) {
  const { email, redirect: redirectTo } = await searchParams;

  if (!email) {
    redirect('/login');
  }

  return (
    <OtpPage
      email={email.trim().toLowerCase()}
      redirectTo={getSafeRedirect(redirectTo)}
    />
  );
}
