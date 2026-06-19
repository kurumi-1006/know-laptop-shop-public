'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/features/auth/lib/auth-client';
import { UserRole, isStaff } from '@/lib/roles';
import {
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  PackageIcon,
  StarIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

type NavUserProps = {
  user: {
    name: string | null;
    email: string;
    image?: string | null;
    role?: string | null;
  };
};

function getInitials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  const signOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message || 'Không thể đăng xuất.');
      return;
    }

    toast.success('Đã đăng xuất thành công.');
    router.push('/');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Mở menu người dùng"
          className="rounded-full"
          size="icon"
          variant="ghost"
        >
          <Avatar>
            <AvatarImage alt={user.name ?? user.email} src={user.image ?? undefined} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 p-2">
          <Avatar size="lg">
            <AvatarImage alt={user.name ?? user.email} src={user.image ?? undefined} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">
              {user.name || user.email}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
            <Badge className="mt-1 capitalize" variant="secondary">
              {user.role || UserRole.customer}
            </Badge>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isDashboard ? (
            <DropdownMenuItem asChild>
              <Link href="/">
                <HomeIcon />
                Trang chủ
              </Link>
            </DropdownMenuItem>
          ) : isStaff(user.role) ? (
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboardIcon />
                Bảng điều khiển
              </Link>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon />
                  Hồ sơ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/orders">
                  <PackageIcon />
                  Đơn hàng
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/reviews">
                  <StarIcon />
                  Đánh giá
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/address">
                  <MapPinIcon />
                  Địa chỉ
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} variant="destructive">
          <LogOutIcon />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
