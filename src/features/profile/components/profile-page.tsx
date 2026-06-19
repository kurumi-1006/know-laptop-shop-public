"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/features/auth/lib/auth-client";
import { AccountNavigation } from "@/features/profile/components/account-navigation";
import { PersonalInfoForm } from "@/features/profile/components/personal-info-form";
import { ShieldCheckIcon } from "lucide-react";

function getInitials(name?: string | null) {
  return (
    name
      ?.split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?"
  );
}

export function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="relative flex flex-col gap-5 px-5 pb-6 pt-12 sm:flex-row sm:items-end sm:px-7">
          {isPending ? (
            <>
              <Skeleton className="size-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64 max-w-full" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="size-24 border-4 border-background shadow-md">
                <AvatarImage alt={user?.name ?? ""} src={user?.image ?? undefined} />
                <AvatarFallback className="text-2xl font-semibold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight">
                    {user?.name ?? "Hồ sơ của bạn"}
                  </h1>
                  <Badge className="capitalize" variant="secondary">
                    {user?.role ?? "customer"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheckIcon className="size-4 text-emerald-600" />
                  Thông tin mua sắm và giao hàng của bạn được lưu trữ an toàn.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AccountNavigation />
        <div className="min-w-0">
          <PersonalInfoForm />
        </div>
      </div>
    </div>
  );
}
