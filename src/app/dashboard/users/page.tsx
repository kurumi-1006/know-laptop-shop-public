import { AccountManagement } from "@/features/admin/components/account-management";
import { AppShell } from "@/features/shell/components/app-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers | Know Dashboard",
  description: "Manage Know customer accounts",
};

export default function DashboardUsersPage() {
  return (
    <AppShell>
      <AccountManagement kind="customer" />
    </AppShell>
  );
}
