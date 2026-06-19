import { VoucherManagement } from "@/features/admin/components/voucher-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Vouchers | Know Dashboard",
  description: "Quản lý mã giảm giá khuyến mãi",
};

export default function DashboardVouchersPage() {
  return (
    <Suspense fallback={null}>
      <DashboardVouchersContent />
    </Suspense>
  );
}

async function DashboardVouchersContent() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <VoucherManagement />
    </AppShell>
  );
}
