"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDashboardData } from "./use-dashboard-data";

type DashboardData = NonNullable<ReturnType<typeof useDashboardData>["data"]>;

interface DashboardDataContextValue {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const value = useDashboardData();
  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardDataContext() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error("useDashboardDataContext must be used within DashboardDataProvider");
  return ctx;
}
