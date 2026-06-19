import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { AppShell } from "@/features/shell/components/app-shell";

export default function DashboardLoading() {
  return (
    <AppShell>
      <DashboardSkeleton />
    </AppShell>
  );
}
