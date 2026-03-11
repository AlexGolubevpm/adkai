"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface TrendDataPoint {
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  romi: number;
  traffic: number;
}

interface DashboardChartsProps {
  data: TrendDataPoint[];
}

const chartConfig = [
  {
    title: "Revenue",
    dataKey: "revenue" as const,
    color: "#22c55e",
    gradientId: "fillRevenue",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "Costs",
    dataKey: "costs" as const,
    color: "#ef4444",
    gradientId: "fillCosts",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "Profit",
    dataKey: "profit" as const,
    color: "#3b82f6",
    gradientId: "fillProfit",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "ROMI",
    dataKey: "romi" as const,
    color: "#a78bfa",
    gradientId: "fillRomi",
    formatter: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    title: "Traffic",
    dataKey: "traffic" as const,
    color: "#eab308",
    gradientId: "fillTraffic",
    formatter: (v: number) => v.toLocaleString(),
  },
];

function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  color,
}: {
  active?: boolean;
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  formatter: (v: number) => string;
  color: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 shadow-xl shadow-black/30">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums" style={{ color }}>
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {chartConfig.map((cfg) => {
        const lastValue = data.length > 0 ? data[data.length - 1][cfg.dataKey] : 0;
        const firstValue = data.length > 1 ? data[0][cfg.dataKey] : lastValue;
        const delta = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;

        return (
          <Card key={cfg.dataKey} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-[var(--foreground-subtle)] uppercase tracking-wider">
                    {cfg.title}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: cfg.color }}>
                    {cfg.formatter(lastValue)}
                  </p>
                </div>
                {data.length > 1 && (
                  <span
                    className={`text-xs font-medium tabular-nums rounded-md px-1.5 py-0.5 ${
                      delta >= 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-[160px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id={cfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={cfg.color} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                      tickFormatter={(v: number) =>
                        cfg.dataKey === "romi"
                          ? `${v}%`
                          : cfg.dataKey === "traffic"
                            ? v >= 1000
                              ? `${(v / 1000).toFixed(0)}K`
                              : String(v)
                            : v >= 1000
                              ? `$${(v / 1000).toFixed(0)}K`
                              : `$${v}`
                      }
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent
                          active={active}
                          payload={payload as unknown as Array<{ value: number; color: string }>}
                          label={label as string}
                          formatter={cfg.formatter}
                          color={cfg.color}
                        />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey={cfg.dataKey}
                      stroke={cfg.color}
                      strokeWidth={2}
                      fill={`url(#${cfg.gradientId})`}
                      dot={false}
                      activeDot={{ r: 4, fill: cfg.color, stroke: "var(--surface-1)", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
