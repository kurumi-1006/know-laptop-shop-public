"use client";

import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { useRouter } from "next/navigation";

export function DashboardRealtime() {
  const router = useRouter();

  useSupabaseRealtime({
    channelName: "dashboard-orders",
    table: "orders",
    event: "*",
    callback: () => { router.refresh(); },
  });

  return null;
}
