import { AccountDetail } from "@/features/admin/components/account-detail";
import { AppShell } from "@/features/shell/components/app-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Detail | Know Dashboard",
  description: "View customer account details",
};

export default async function DashboardUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <AccountDetail userId={id} backHref="/dashboard/users" />
    </AppShell>
  );
}
