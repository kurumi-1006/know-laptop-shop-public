import { AccountDetail } from "@/features/admin/components/account-detail";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Employee Detail | Know Dashboard",
  description: "View employee account details",
};

export default function DashboardStaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <DashboardStaffDetailContent params={params} />
    </Suspense>
  );
}

async function DashboardStaffDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  return (
    <AppShell>
      <AccountDetail userId={id} backHref="/dashboard/staff" />
    </AppShell>
  );
}
