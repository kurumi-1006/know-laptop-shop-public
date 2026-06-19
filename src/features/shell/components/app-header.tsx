'use client';

import { ModeToggle } from '@/components/shared/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/features/auth/lib/auth-client';
import { AppBreadcrumbs } from '@/features/shell/components/app-breadcrumbs';
import { navLinks } from '@/features/shell/components/app-shared';
import { CustomSidebarTrigger } from '@/features/shell/components/custom-sidebar-trigger';
import { NavUser } from '@/features/shell/components/nav-user';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const activeItem =
    navLinks.find((item) => item.path === pathname) ??
    (pathname === '/dashboard' ? { title: 'Overview', path: '/dashboard' } : null);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6',
      )}
    >
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={activeItem} />
      </div>
      <div className="flex items-center gap-3">
        <ModeToggle />

        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        {session ? <NavUser user={session.user} /> : null}
      </div>
    </header>
  );
}
