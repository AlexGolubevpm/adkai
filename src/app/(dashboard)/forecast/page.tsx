"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { NativeSelect as Select, SelectOption } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";
import { useApi, periodToDateRange } from "@/lib/hooks";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";
import {
  Minus,
  Target,
  BarChart3,
  Zap,
  ArrowRight,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface SiteForecastData {
  id: string;
  name: string;
  slug: string;
  bundle: { code: string; name: string };
  traffic: number;
  hits: number;
  impressions: number;
  fillRate: number;
  ctr: number;
  realCpm: number;
  brokerCpm: number;
  revenue: number;
  costs: number;
  profit: number;
  romi: number;
  revenuePer1000: number;
  breakevenCpm: number | null;
}

interface ForecastTotals {
  traffic: number;
  hits: number;
  impressions: number;
  revenue: number;
  costs: number;
  profit: number;
  romi: number;
  avgRealCpm: number;
  revenuePer1000: number;
  breakevenCpm: number | null;
}

interface ForecastApiResponse {
  sites: SiteForecastData[];
  totals: ForecastTotals;
}

// ─── Helpers ─────────────────────────────────────────────────────

function DeltaBadge({ delta, format = "currency" }: { delta: number; format?: "currency" | "percent" | "pp" }) {
  const abs = Math.abs(delta);
  const formatted = format === "currency"
    ? formatCurrency(abs)
    : format === "percent"
    ? formatPercent(abs)
    : `${abs.toFixed(1)}pp`;

  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-xs text-[var(--foreground-subtle)]">
      <Minus className="h-3 w-3" /> {format === "currency" ? "$0.00" : "0%"}
    </span>
  );

  return delta > 0 ? (
    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
      <ChevronUp className="h-3 w-3" />+{formatted}
    </span>
  ) : (
    <span className="flex items-center gap-0.5 text-xs font-medium text-red-600">
      <ChevronDown className="h-3 w-3" />-{formatted}
    </span>
  );
}

function RangeSlider({
  value,
  onChange,
  min = -80,
  max = 200,
  step = 5,
  label,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-[var(--foreground-muted)]">{label}</span>
      <div className="relative flex-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
          style={{ accentColor: color }}
        />
        {/* Zero line indicator */}
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-gray-400/40 rounded"
          style={{ left: `${((-min) / (max - min)) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "w-14 text-right text-sm font-semibold tabular-nums",
            value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : "text-[var(--foreground-muted)]"
          )}
        >
          {value > 0 ? "+" : ""}{value}%
        </span>
        <button
          onClick={() => onChange(0)}
          className="text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────

interface ChartTooltipPayload {
  value: number;
  name: string;
  color: string;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 shadow-xl text-xs space-y-1">
      <p className="font-medium text-[var(--foreground)] mb-1.5">CPM {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function ForecastPage() {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "yesterday" });
  const [bundleFilter, setBundleFilter] = useState("all");

  // Scenario controls
  const [cpmDelta, setCpmDelta] = useState(0);      // % change in CPM
  const [trafficDelta, setTrafficDelta] = useState(0); // % change in traffic
  const [costsDelta, setCostsDelta] = useState(0);    // % change in costs

  const range = useMemo(
    () => periodToDateRange(period.preset, period.from, period.to),
    [period]
  );

  const params = useMemo(() => {
    const p = new URLSearchParams({ from: range.from, to: range.to });
    if (bundleFilter !== "all") p.set("bundle", bundleFilter);
    return p.toString();
  }, [range, bundleFilter]);

  const { data, loading } = useApi<ForecastApiResponse>(`/api/forecast/sites?${params}`);

  const sites = data?.sites ?? [];
  const totals = data?.totals ?? {
    traffic: 0, hits: 0, impressions: 0, revenue: 0, costs: 0, profit: 0,
    romi: 0, avgRealCpm: 0, revenuePer1000: 0, breakevenCpm: null,
  };

  // ─── Scenario Calculations ────────────────────────────────────

  const cpmMult = 1 + cpmDelta / 100;
  const trafficMult = 1 + trafficDelta / 100;
  const costsMult = 1 + costsDelta / 100;

  const proj = useMemo(() => {
    const revenue = totals.revenue * cpmMult * trafficMult;
    const costs = totals.costs * costsMult;
    const profit = revenue - costs;
    const romi = costs > 0 ? ((revenue - costs) / costs) * 100 : 0;
    const revenuePer1000 = totals.traffic * trafficMult > 0
      ? (revenue / (totals.traffic * trafficMult)) * 1000
      : 0;
    const avgRealCpm = totals.avgRealCpm * cpmMult;

    return { revenue, costs, profit, romi, revenuePer1000, avgRealCpm };
  }, [totals, cpmMult, trafficMult, costsMult]);

  // ─── CPM Sensitivity Chart Data ───────────────────────────────

  const sensitivityData = useMemo(() => {
    const mults = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2.0, 2.5, 3.0];
    const projectedCosts = totals.costs * costsMult;

    return mults.map((mult) => {
      const revenue = totals.revenue * mult * trafficMult;
      const profit = revenue - projectedCosts;
      const cpmVal = totals.avgRealCpm * mult;
      return {
        cpm: parseFloat(cpmVal.toFixed(4)),
        cpmLabel: `$${cpmVal.toFixed(2)}`,
        revenue: parseFloat(revenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        mult,
      };
    });
  }, [totals, trafficMult, costsMult]);

  // Breakeven CPM multiplier (where profit = 0)
  const breakevenMult = useMemo(() => {
    if (totals.revenue * trafficMult === 0) return null;
    return (totals.costs * costsMult) / (totals.revenue * trafficMult);
  }, [totals, trafficMult, costsMult]);

  const breakevenCpm = breakevenMult !== null ? totals.avgRealCpm * breakevenMult : null;

  // CPM needed for target ROMI
  const cpmForRomi = useCallback((targetRomi: number) => {
    if (totals.revenue * trafficMult === 0) return null;
    const mult = (totals.costs * costsMult * (1 + targetRomi / 100)) / (totals.revenue * trafficMult);
    return totals.avgRealCpm * mult;
  }, [totals, trafficMult, costsMult]);

  // Reference lines for chart (as CPM dollar values)
  const currentCpmMult = 1.0;
  const projectedCpmMult = cpmMult;

  // ─── Per-site table ───────────────────────────────────────────

  const projectedSites = useMemo(() => {
    return sites.map((site) => {
      const projRevenue = site.revenue * cpmMult * trafficMult;
      const projCosts = site.costs * costsMult;
      const projProfit = projRevenue - projCosts;
      const projRomi = projCosts > 0 ? ((projRevenue - projCosts) / projCosts) * 100 : 0;
      const projCpm = site.realCpm * cpmMult;

      return {
        ...site,
        projRevenue,
        projCosts,
        projProfit,
        projRomi,
        projCpm,
        revenueDelta: projRevenue - site.revenue,
        romiDelta: projRomi - site.romi,
      };
    });
  }, [sites, cpmMult, trafficMult, costsMult]);

  const hasScenario = cpmDelta !== 0 || trafficDelta !== 0 || costsDelta !== 0;

  // ─── KPI data ──────────────────────────────────────────────────

  const kpiItems = [
    {
      label: "Revenue",
      current: totals.revenue,
      projected: proj.revenue,
      delta: proj.revenue - totals.revenue,
      format: "currency" as const,
      color: "#22c55e",
      bgColor: "var(--success-light, rgba(34,197,94,0.08))",
    },
    {
      label: "Profit",
      current: totals.profit,
      projected: proj.profit,
      delta: proj.profit - totals.profit,
      format: "currency" as const,
      color: "#3b82f6",
      bgColor: "var(--info-light, rgba(59,130,246,0.08))",
    },
    {
      label: "ROMI",
      current: totals.romi,
      projected: proj.romi,
      delta: proj.romi - totals.romi,
      format: "pp" as const,
      color: "#a855f7",
      bgColor: "rgba(168,85,247,0.08)",
    },
    {
      label: "Revenue / 1K",
      current: totals.revenuePer1000,
      projected: proj.revenuePer1000,
      delta: proj.revenuePer1000 - totals.revenuePer1000,
      format: "currency" as const,
      color: "#f59e0b",
      bgColor: "var(--warning-light, rgba(245,158,11,0.08))",
    },
  ];

  // ─── Render ───────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--foreground-muted)" }}>
            Simulate CPM changes and model revenue scenarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={bundleFilter}
            onChange={(e) => setBundleFilter(e.target.value)}
            className="w-36"
          >
            <SelectOption value="all">All Bundles</SelectOption>
            <SelectOption value="gays">Gays</SelectOption>
            <SelectOption value="trans">Trans</SelectOption>
            <SelectOption value="hentai">Hentai</SelectOption>
            <SelectOption value="jav">JAV</SelectOption>
          </Select>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Scenario Controls */}
      <div className="section-panel">
        <div className="section-panel-header">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10">
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <h2 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
              Scenario Controls
            </h2>
          </div>
          {hasScenario && (
            <button
              onClick={() => { setCpmDelta(0); setTrafficDelta(0); setCostsDelta(0); }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset all
            </button>
          )}
        </div>
        <div className="section-panel-content space-y-3">
          <RangeSlider
            label="CPM"
            value={cpmDelta}
            onChange={setCpmDelta}
            min={-80}
            max={300}
            step={5}
            color="#6366f1"
          />
          <RangeSlider
            label="Traffic"
            value={trafficDelta}
            onChange={setTrafficDelta}
            min={-80}
            max={300}
            step={5}
            color="#06b6d4"
          />
          <RangeSlider
            label="Costs"
            value={costsDelta}
            onChange={setCostsDelta}
            min={-100}
            max={200}
            step={5}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiItems.map((kpi) => (
          <div key={kpi.label} className="kpi-card relative overflow-hidden">
            <div style={{ padding: 16 }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-2">
                {kpi.label}
              </p>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  {/* Current */}
                  <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                    <span className="text-xs">Now:</span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                      {kpi.format === "pp"
                        ? formatPercent(kpi.current)
                        : formatCurrency(kpi.current)}
                    </span>
                  </div>

                  {/* Arrow + Projected */}
                  <div className="my-1 flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: kpi.color }} />
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: kpi.color }}
                    >
                      {kpi.format === "pp"
                        ? formatPercent(kpi.projected)
                        : formatCurrency(kpi.projected)}
                    </span>
                  </div>

                  {/* Delta */}
                  <DeltaBadge delta={kpi.delta} format={kpi.format === "pp" ? "pp" : "currency"} />
                </>
              )}
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30"
              style={{ backgroundColor: kpi.color }}
            />
          </div>
        ))}
      </div>

      {/* Chart + Breakeven */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* CPM Sensitivity Chart */}
        <div className="section-panel lg:col-span-2">
          <div className="section-panel-header">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--foreground-muted)]" />
              <h2 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                CPM Sensitivity
              </h2>
            </div>
          </div>
          <div className="section-panel-content">
            <p className="text-xs text-[var(--foreground-muted)] mb-3">
              Revenue & profit across CPM values — current, projected, and breakeven marked
            </p>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : totals.revenue === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-[var(--foreground-muted)]">
                No data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={sensitivityData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="cpmLabel"
                    tick={{ fontSize: 10, fill: "var(--foreground-subtle)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--foreground-subtle)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    width={60}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={6}
                  />

                  {/* Revenue area */}
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#22c55e" }}
                  />

                  {/* Profit area */}
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#profitGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#3b82f6" }}
                  />

                  {/* Current CPM reference */}
                  <ReferenceLine
                    x={`$${(totals.avgRealCpm * currentCpmMult).toFixed(2)}`}
                    stroke="var(--foreground-subtle)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Now",
                      position: "top",
                      fontSize: 10,
                      fill: "var(--foreground-subtle)",
                    }}
                  />

                  {/* Projected CPM reference */}
                  {hasScenario && (
                    <ReferenceLine
                      x={`$${(totals.avgRealCpm * projectedCpmMult).toFixed(2)}`}
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{
                        value: "Target",
                        position: "top",
                        fontSize: 10,
                        fill: "#6366f1",
                      }}
                    />
                  )}

                  {/* Zero profit line */}
                  <ReferenceLine
                    y={0}
                    stroke="rgba(239,68,68,0.4)"
                    strokeDasharray="3 3"
                    label={{
                      value: "Breakeven",
                      position: "insideBottomRight",
                      fontSize: 9,
                      fill: "rgba(239,68,68,0.6)",
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakeven Analysis */}
        <div className="section-panel">
          <div className="section-panel-header">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--foreground-muted)]" />
              <h2 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                Breakeven Analysis
              </h2>
            </div>
          </div>
          <div className="section-panel-content space-y-3">
            <p className="text-xs text-[var(--foreground-muted)]">
              CPM targets based on {hasScenario ? "projected" : "current"} costs
            </p>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : (
              <>
                {/* Current avg CPM */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
                    Current Avg CPM
                  </div>
                  <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                    {totals.avgRealCpm > 0 ? `$${totals.avgRealCpm.toFixed(3)}` : "\u2014"}
                  </div>
                  {hasScenario && (
                    <div className="text-sm text-indigo-600 mt-0.5">
                      \u2192 ${proj.avgRealCpm.toFixed(3)} projected
                    </div>
                  )}
                </div>

                {/* Target CPMs */}
                {[
                  { label: "Break-even", romi: 0, color: "#ef4444" },
                  { label: "50% ROMI", romi: 50, color: "#f59e0b" },
                  { label: "100% ROMI", romi: 100, color: "#22c55e" },
                  { label: "200% ROMI", romi: 200, color: "#6366f1" },
                ].map(({ label, romi, color }) => {
                  const targetCpm = romi === 0 ? breakevenCpm : cpmForRomi(romi);
                  const currentCpm = totals.avgRealCpm;
                  const isCurrent = romi === 0
                    ? totals.profit >= 0
                    : totals.romi >= romi;

                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                      style={{ borderColor: isCurrent ? `${color}40` : undefined }}
                    >
                      <div>
                        <div className="text-xs font-medium text-[var(--foreground)]">
                          {label}
                        </div>
                        <div className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">
                          {targetCpm !== null
                            ? `Need $${targetCpm.toFixed(3)}`
                            : "No cost data"}
                        </div>
                      </div>
                      <div className="text-right">
                        {targetCpm !== null ? (
                          <>
                            <div className="text-sm font-bold tabular-nums" style={{ color }}>
                              ${targetCpm.toFixed(3)}
                            </div>
                            <div className={cn(
                              "text-[10px]",
                              isCurrent ? "text-emerald-600" : "text-[var(--foreground-subtle)]"
                            )}>
                              {isCurrent ? "\u2713 Achieved" : `Gap: ${((targetCpm / currentCpm - 1) * 100).toFixed(0)}%`}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--foreground-subtle)]">\u2014</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Per-Site Breakdown */}
      <div className="data-table-container">
        <div className="data-table-toolbar">
          <div className="flex items-center justify-between w-full">
            <h2 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
              Per-Site Breakdown
            </h2>
            <Badge variant="secondary">{projectedSites.length} sites</Badge>
          </div>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : projectedSites.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--foreground-muted)]">
            No site data for this period
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Bundle</th>
                <th className="text-right">CPM</th>
                {hasScenario && <th className="text-right">Proj CPM</th>}
                <th className="text-right">Revenue</th>
                {hasScenario && <th className="text-right">Proj Rev</th>}
                <th className="text-right">ROMI</th>
                {hasScenario && <th className="text-right">Proj ROMI</th>}
                <th className="text-right">Traffic</th>
              </tr>
            </thead>
            <tbody>
              {projectedSites
                .sort((a, b) => b.revenue - a.revenue)
                .map((site) => {
                  const bundleColor =
                    site.bundle.code === "gays" ? "text-blue-600" :
                    site.bundle.code === "trans" ? "text-pink-600" :
                    site.bundle.code === "hentai" ? "text-purple-600" :
                    site.bundle.code === "jav" ? "text-orange-600" :
                    "text-[var(--foreground-muted)]";

                  return (
                    <tr key={site.id}>
                      <td className="font-medium text-[var(--foreground)]">
                        {site.name}
                      </td>
                      <td>
                        <span className={cn("text-xs font-medium", bundleColor)}>
                          {site.bundle.name}
                        </span>
                      </td>
                      <td className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {site.realCpm > 0 ? `$${site.realCpm.toFixed(3)}` : "\u2014"}
                      </td>
                      {hasScenario && (
                        <td className="text-right tabular-nums">
                          <span className="text-indigo-600 font-medium">
                            {site.projCpm > 0 ? `$${site.projCpm.toFixed(3)}` : "\u2014"}
                          </span>
                        </td>
                      )}
                      <td className="text-right tabular-nums font-medium text-emerald-600">
                        {formatCurrency(site.revenue)}
                      </td>
                      {hasScenario && (
                        <td className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="tabular-nums font-medium text-indigo-600">
                              {formatCurrency(site.projRevenue)}
                            </span>
                            <DeltaBadge delta={site.revenueDelta} format="currency" />
                          </div>
                        </td>
                      )}
                      <td className="text-right tabular-nums">
                        <span className={cn(
                          "font-medium",
                          site.romi >= 100 ? "text-emerald-600" :
                          site.romi >= 0 ? "text-amber-600" : "text-red-600"
                        )}>
                          {formatPercent(site.romi)}
                        </span>
                      </td>
                      {hasScenario && (
                        <td className="text-right">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "tabular-nums font-medium",
                              site.projRomi >= 100 ? "text-emerald-600" :
                              site.projRomi >= 0 ? "text-amber-600" : "text-red-600"
                            )}>
                              {formatPercent(site.projRomi)}
                            </span>
                            <DeltaBadge delta={site.romiDelta} format="pp" />
                          </div>
                        </td>
                      )}
                      <td className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {formatNumber(site.traffic)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
