"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { PRESETS, type DatePreset, useDashboardDate } from "../hooks/use-dashboard-date";

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Hôm nay",
  "7days": "7 ngày",
  "30days": "30 ngày",
  thisMonth: "Tháng này",
  custom: "Tùy chọn",
};

export function DashboardDateFilter() {
  const { dateRange, setPreset, setCustomRange, label } = useDashboardDate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPreset(preset)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              dateRange.preset === preset
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-xs",
              dateRange.preset === "custom" && "border-primary text-primary",
            )}
          >
            <CalendarIcon className="size-3.5" />
            {dateRange.preset === "custom"
              ? `${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: vi })} - ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: vi })}`
              : label}
            <ChevronDownIcon className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{
              from: new Date(dateRange.from),
              to: new Date(dateRange.to),
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setCustomRange(
                  range.from.toISOString().slice(0, 10),
                  range.to.toISOString().slice(0, 10),
                );
              }
            }}
            numberOfMonths={2}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
