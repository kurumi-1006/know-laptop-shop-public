"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export type DatePreset = "today" | "7days" | "30days" | "thisMonth" | "custom";

export interface DateRange {
  from: string;
  to: string;
  preset: DatePreset;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getPresetRange(preset: DatePreset): { from: string; to: string } {
  switch (preset) {
    case "today":
      return { from: today(), to: today() };
    case "7days":
      return { from: daysAgo(6), to: today() };
    case "30days":
      return { from: daysAgo(29), to: today() };
    case "thisMonth":
      return { from: startOfMonth(), to: today() };
    default:
      return { from: daysAgo(6), to: today() };
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Hôm nay",
  "7days": "7 ngày",
  "30days": "30 ngày",
  thisMonth: "Tháng này",
  custom: "Tùy chọn",
};

export const PRESETS: DatePreset[] = ["today", "7days", "30days", "thisMonth"];

export function useDashboardDate() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dateRange: DateRange = useMemo(() => {
    const preset = (searchParams.get("preset") as DatePreset) || "7days";
    if (preset === "custom") {
      return {
        from: searchParams.get("from") || daysAgo(6),
        to: searchParams.get("to") || today(),
        preset: "custom",
      };
    }
    return { ...getPresetRange(preset), preset };
  }, [searchParams]);

  const setPreset = useCallback(
    (preset: DatePreset) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("preset", preset);
      if (preset !== "custom") {
        params.delete("from");
        params.delete("to");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const setCustomRange = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("preset", "custom");
      params.set("from", from);
      params.set("to", to);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const label = PRESET_LABELS[dateRange.preset];

  return { dateRange, setPreset, setCustomRange, label };
}
