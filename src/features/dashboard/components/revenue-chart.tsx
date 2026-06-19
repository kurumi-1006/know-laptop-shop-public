"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardDataContext } from "../hooks/dashboard-data-context";

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatRevenue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export function RevenueChart() {
  const { data, loading, error } = useDashboardDataContext();
  const dailyRevenue = data?.dailyRevenue ?? [];
  const hasRevenue = dailyRevenue.some((d) => d.revenue > 0);

  return (
    <Card className="col-span-full shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle>Doanh thu theo ngày</CardTitle>
        <CardDescription>Tổng doanh thu theo ngày từ đơn đã hoàn thành</CardDescription>
      </CardHeader>
      <CardContent className="pl-0 pr-2">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-sm text-destructive">{error}</div>
        ) : !hasRevenue ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Chưa có doanh thu nào trong khoảng thời gian này.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <BarChart data={dailyRevenue} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                tick={{ fontWeight: "600" }}
                interval={dailyRevenue.length > 14 ? Math.floor(dailyRevenue.length / 7) : 0}
              />
              <YAxis
                tickFormatter={formatRevenue}
                tickLine={false}
                axisLine={false}
                tick={{ fontWeight: "600" }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => formatShortDate(String(label))}
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Doanh thu:</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {Number(value).toLocaleString("vi-VN")} VND
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                opacity={0.8}
                activeBar={{ opacity: 1, fill: "var(--color-revenue)" }}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
