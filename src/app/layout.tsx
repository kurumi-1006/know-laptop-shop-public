import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SiteShell } from '@/features/shell/components/site-shell';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Suspense } from 'react';
import './globals.css';

const geistSans = Geist({
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
  preload: true,
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  display: 'swap',
  fallback: ['Consolas', 'monospace'],
  preload: false,
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Know — Cửa hàng Laptop',
  description: 'Tìm laptop phù hợp cho gaming, doanh nghiệp và học tập với thông số rõ ràng và hỗ trợ đáng tin cậy.',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader
          color="var(--primary)"
          initialPosition={0.08}
          crawlSpeed={150}
          speed={300}
          easing="ease-in-out"
          height={4}
          crawl
          showSpinner={false}
          shadow={false}
          zIndex={9999}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              <Suspense fallback={null}>
                <SiteShell>{children}</SiteShell>
              </Suspense>
              {modal}
            </TooltipProvider>
            <Toaster
              position="bottom-right"
              closeButton
              duration={3000}
              expand={false}
              visibleToasts={3}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
