import { CategoryManagement } from "@/features/admin/components/category-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Danh mục | Know Dashboard",
  description: "Quản lý danh mục sản phẩm",
};

export default function DashboardCategoriesPage() {
  return (
    <Suspense fallback={null}>
      <DashboardCategoriesContent />
    </Suspense>
  );
}

async function DashboardCategoriesContent() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <CategoryManagement />
    </AppShell>
  );
}
