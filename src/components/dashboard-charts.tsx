"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    title: "Revenue Trend",
    dataKey: "revenue" as const,
    color: "#34d399",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "Costs Trend",
    dataKey: "costs" as const,
    color: "#f87171",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "Profit Trend",
    dataKey: "profit" as const,
    color: "#60a5fa",
    formatter: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    title: "ROMI Trend",
    dataKey: "romi" as const,
    color: "#a78bfa",
    formatter: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    title: "Traffic Trend",
    dataKey: "traffic" as const,
    color: "#fbbf24",
    formatter: (v: number) => v.toLocaleString(),
  },
];

function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {chartConfig.map((cfg) => (
        <Card key={cfg.dataKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              {cfg.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={{ stroke: "#27272a" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
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
                        payload={payload as Array<{ value: number; color: string }>}
                        label={label}
                        formatter={cfg.formatter}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey={cfg.dataKey}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: cfg.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
