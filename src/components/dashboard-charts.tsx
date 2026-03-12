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
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "var(--surface-0)",
        boxShadow: "var(--shadow-lg)",
        padding: "10px 14px",
      }}
    >
      <p
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--foreground-subtle)",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color,
        }}
      >
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {chartConfig.map((cfg) => {
        const lastValue = data.length > 0 ? data[data.length - 1][cfg.dataKey] : 0;
        const firstValue = data.length > 1 ? data[0][cfg.dataKey] : lastValue;
        const delta =
          firstValue !== 0
            ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100
            : 0;

        return (
          <div
            key={cfg.dataKey}
            style={{
              padding: "20px 20px 16px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 16 }}
            >
              <div>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--foreground-subtle)",
                    marginBottom: 6,
                  }}
                >
                  {cfg.title}
                </p>
                <p
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--foreground)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {cfg.formatter(lastValue)}
                </p>
              </div>
              {data.length > 1 && (
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    borderRadius: "var(--radius-md)",
                    padding: "4px 10px",
                    ...(delta >= 0
                      ? {
                          background: "var(--success-light)",
                          color: "var(--success)",
                        }
                      : {
                          background: "var(--danger-light)",
                          color: "var(--danger)",
                        }),
                  }}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)}%
                </span>
              )}
            </div>
            <div style={{ height: 140, margin: "0 -8px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient
                      id={cfg.gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={cfg.color}
                        stopOpacity={0.12}
                      />
                      <stop
                        offset="100%"
                        stopColor={cfg.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: "var(--foreground-subtle)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "var(--foreground-subtle)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
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
                        payload={
                          payload as unknown as Array<{
                            value: number;
                            color: string;
                          }>
                        }
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
                    activeDot={{
                      r: 5,
                      fill: cfg.color,
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
