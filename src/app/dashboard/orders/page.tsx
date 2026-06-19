import { OrderManagement } from "@/features/admin/components/order-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isStaff } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Đơn hàng | Know Dashboard",
  description: "Quản lý đơn hàng",
};

export default function DashboardOrdersPage() {
  return (
    <Suspense fallback={null}>
      <DashboardOrdersContent />
    </Suspense>
  );
}

async function DashboardOrdersContent() {
  const session = await getCurrentSession();

  if (!session || !isStaff(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <OrderManagement />
    </AppShell>
  );
}
