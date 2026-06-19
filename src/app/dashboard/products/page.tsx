import { ProductManagement } from "@/features/admin/components/product-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sản phẩm | Know Dashboard",
  description: "Quản lý sản phẩm laptop",
};

export default function DashboardProductsPage() {
  return (
    <Suspense fallback={null}>
      <DashboardProductsContent />
    </Suspense>
  );
}

async function DashboardProductsContent() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <ProductManagement />
    </AppShell>
  );
}
