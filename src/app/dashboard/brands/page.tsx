import { BrandManagement } from "@/features/admin/components/brand-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Thương hiệu | Know Dashboard",
  description: "Quản lý thương hiệu sản phẩm",
};

export default function DashboardBrandsPage() {
  return (
    <Suspense fallback={null}>
      <DashboardBrandsContent />
    </Suspense>
  );
}

async function DashboardBrandsContent() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <BrandManagement />
    </AppShell>
  );
}
