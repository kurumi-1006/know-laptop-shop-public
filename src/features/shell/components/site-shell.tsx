'use client';

import { Footer } from '@/features/marketing/components/footer';
import { Header } from '@/features/marketing/components/header';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const LaptopChatbot = dynamic(
  () =>
    import('@/features/chat/components/laptop-chatbot').then(
      (module) => module.LaptopChatbot,
    ),
  { ssr: false },
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showChatbot, setShowChatbot] = useState(false);
  const hasStandaloneLayout =
    pathname.startsWith('/login') || pathname.startsWith('/dashboard');

  if (hasStandaloneLayout) {
    return children;
  }

  return (
    <>
      <Header />
      <div className="h-16" />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      {showChatbot ? (
        <LaptopChatbot defaultOpen />
      ) : (
        <button
          aria-label="Open laptop assistant"
          className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
          onClick={() => setShowChatbot(true)}
          type="button"
        >
          AI
          <span className="absolute right-0 top-0 size-3 rounded-full border-2 border-background bg-emerald-500" />
        </button>
      )}
    </>
  );
}
