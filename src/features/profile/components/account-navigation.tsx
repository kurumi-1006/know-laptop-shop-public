"use client";

import { cn } from "@/lib/utils";
import { MapPinIcon, PackageIcon, UserIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    label: "Chi tiết tài khoản",
    description: "Thông tin cho đơn hàng và hỗ trợ",
    href: "/profile",
    icon: UserIcon,
  },
  {
    label: "Đơn hàng",
    description: "Xem và quản lý đơn hàng của bạn",
    href: "/profile/orders",
    icon: PackageIcon,
  },
  {
    label: "Địa chỉ giao hàng",
    description: "Địa điểm giao laptop",
    href: "/address",
    icon: MapPinIcon,
  },
  {
    label: "Lịch sử đánh giá",
    description: "Quản lý nhận xét của bạn",
    href: "/profile/reviews",
    icon: StarIcon,
  },
];

export function AccountNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Cài đặt tài khoản">
      <div className="grid gap-2 rounded-xl border bg-card p-2 sm:grid-cols-2 lg:grid-cols-1">
        {links.map(({ label, description, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={href}
              key={href}
              prefetch={href === "/address" ? null : true}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
