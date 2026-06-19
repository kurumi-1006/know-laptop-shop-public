import { FeedbackManagement } from "@/features/admin/components/feedback-management";
import { getCurrentSession } from "@/features/auth/lib/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { isAdmin } from "@/lib/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Feedbacks | Know Dashboard",
  description: "Quản lý phản hồi khách hàng",
};

export default function DashboardFeedbacksPage() {
  return (
    <Suspense fallback={null}>
      <DashboardFeedbacksContent />
    </Suspense>
  );
}

async function DashboardFeedbacksContent() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <FeedbackManagement />
    </AppShell>
  );
}
