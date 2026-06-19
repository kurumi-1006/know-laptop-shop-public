'use client';

import { LogoIcon } from '@/components/shared/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { authClient } from '@/features/auth/lib/auth-client';
import { navGroups } from '@/features/shell/components/app-shared';
import { NavGroup } from '@/features/shell/components/nav-group';
import { isAdmin } from '@/lib/roles';
import Link from 'next/link';

export function AppSidebar() {
  const { data: session } = authClient.useSession();
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin(session?.user.role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenuButton asChild>
          <Link href="/dashboard">
            <LogoIcon className="h-7 w-auto shrink-0" />
            <span className="font-medium">Know</span>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
