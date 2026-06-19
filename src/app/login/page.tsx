import { AuthPage } from '@/features/auth/components/auth-page';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Sign in | Know',
  description: 'Sign in to your Know account to manage orders, addresses, and more.',
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
