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
    color: "#059669",
    gradientId: "fillRevenue",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "Costs",
    dataKey: "costs" as const,
    color: "#dc2626",
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
    color: "#7c3aed",
    gradientId: "fillRomi",
    formatter: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    title: "Traffic",
    dataKey: "traffic" as const,
    color: "#d97706",
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
    <div
      className="rounded-lg border px-3 py-2"
      style={{
        borderColor: "var(--border)",
        background: "white",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <p
        className="mb-1 text-[10px] font-medium uppercase tracking-wider"
        style={{ color: "var(--foreground-subtle)" }}
      >
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
            <CardContent className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p
                    className="text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: "var(--foreground-subtle)" }}
                  >
                    {cfg.title}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
                    {cfg.formatter(lastValue)}
                  </p>
                </div>
                {data.length > 1 && (
                  <span
                    className="text-xs font-medium tabular-nums rounded-md px-2 py-0.5"
                    style={
                      delta >= 0
                        ? { background: "var(--success-light)", color: "var(--success)" }
                        : { background: "var(--danger-light)", color: "var(--danger)" }
                    }
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
                        <stop offset="0%" stopColor={cfg.color} stopOpacity={0.08} />
                        <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
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
                      strokeWidth={1.5}
                      fill={`url(#${cfg.gradientId})`}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: cfg.color,
                        stroke: "white",
                        strokeWidth: 2,
                      }}
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
