"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  delta?: number;
  deltaLabel?: string;
  sparklineData?: number[];
  tooltip?: string;
  loading?: boolean;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  delta,
  deltaLabel,
  sparklineData,
  tooltip,
  loading,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-hover)] transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: bg, color }}
            >
              <Icon style={{ width: 18, height: 18 }} />
            </div>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-[var(--foreground-disabled)] hover:text-[var(--foreground-subtle)] transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-7 w-24 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          ) : (
            <>
              <div
                className="text-2xl font-bold tabular-nums leading-none tracking-tight"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                {value}
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {label}
                </span>
                {delta !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums rounded-md px-1.5 py-0.5",
                      delta > 0
                        ? "text-[var(--success)] bg-[var(--success-light)]"
                        : delta < 0
                        ? "text-[var(--danger)] bg-[var(--danger-light)]"
                        : "text-[var(--foreground-subtle)] bg-[var(--surface-2)]"
                    )}
                  >
                    {delta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : delta < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}%
                  </span>
                )}
              </div>

              {sparklineData && sparklineData.length > 1 && (
                <MiniSparkline data={sparklineData} color={color} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KpiCardGrid({ children, cols = 6 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  );
}
