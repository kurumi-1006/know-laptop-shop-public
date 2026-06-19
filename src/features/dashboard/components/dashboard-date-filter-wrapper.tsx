"use client";

import { Suspense } from "react";
import { DashboardDateFilter } from "./dashboard-date-filter";

export function DashboardDateFilterWrapper() {
  return (
    <Suspense fallback={null}>
      <DashboardDateFilter />
    </Suspense>
  );
}
