"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StaffMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

function roleLabel(role: string): { label: string; variant: "default" | "secondary" | "outline" } {
  if (role === "admin") return { label: "Quản trị viên", variant: "default" };
  if (role === "staff") return { label: "Nhân viên", variant: "secondary" };
  return { label: role, variant: "outline" };
}

export function TeamOnDuty({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch("/api/admin/accounts?role=staff&role=admin");
        if (!res.ok) return;
        const data = await res.json();

        const staffMembers = (data.data ?? [])
          .filter((a: StaffMember) => a.role === "admin" || a.role === "staff")
          .slice(0, 10);
        setStaff(staffMembers);
      } catch {

      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  return (
    <Card className={cn("shadow-none dark:ring-0", className)} {...props}>
      <CardHeader className="border-b">
        <CardTitle>Nhân viên đang hoạt động</CardTitle>
        <CardDescription>
          {loading
            ? "Đang tải..."
            : staff.length > 0
              ? `${staff.length} nhân viên`
              : "Chưa có nhân viên nào"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Đang tải danh sách nhân viên...
          </div>
        ) : staff.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Chưa có nhân viên nào trong hệ thống.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {staff.map((member) => {
              const { label, variant } = roleLabel(member.role);
              return (
                <li
                  className="flex items-center gap-3 p-3 first:pt-0 last:pb-0 sm:gap-3"
                  key={member.id}
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{getInitials(member.name, member.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="truncate font-medium text-foreground text-sm leading-snug">
                      {member.name ?? member.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-snug truncate">
                      {member.email}
                    </p>
                  </div>
                  <Badge variant={variant} className="shrink-0">{label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
