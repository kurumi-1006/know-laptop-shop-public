import { AccountManagement } from "@/features/admin/components/account-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Employees | Know Dashboard",
  description: "Manage Know staff accounts",
};

export default function DashboardStaffPage() {
  return (
    <Suspense fallback={null}>
      <DashboardStaffContent />
    </Suspense>
  );
}

async function DashboardStaffContent() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <AccountManagement kind="staff" />
    </AppShell>
  );
}
