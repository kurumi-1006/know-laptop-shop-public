import { AppShell } from '@/features/shell/components/app-shell';
import { Dashboard } from '@/features/dashboard/components/dashboard';
import { DashboardRealtime } from '@/features/dashboard/components/dashboard-realtime';
import { DashboardDateFilterWrapper } from '@/features/dashboard/components/dashboard-date-filter-wrapper';
import { DashboardFacade } from '@/features/dashboard/lib/dashboard-facade';
import { ExportReportDropdown } from '@/features/report/components/export-report-dropdown';
import { getCurrentSession } from '@/features/auth/lib/session';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard | Know',
  description: 'Know workspace dashboard',
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await getCurrentSession();
  if (!session || session.user.role === 'customer') redirect('/');
  const widgets = new DashboardFacade().getWidgets(session.user.role);

  return (
    <AppShell>
      <DashboardRealtime />
      <div className="mb-4 flex items-center justify-between gap-4">
        <DashboardDateFilterWrapper />
        <ExportReportDropdown />
      </div>
      <Dashboard widgets={widgets} />
    </AppShell>
  );
}
