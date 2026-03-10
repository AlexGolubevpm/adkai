"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Target,
  Activity,
  Heart,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";
import DashboardCharts from "@/components/dashboard-charts";
import {
  cn,
  formatNumber,
  formatCurrency,
  formatPercent,
  getHealthStatus,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const BUNDLES = ["Gays", "Trans", "Hentai", "JAV"] as const;
type BundleName = (typeof BUNDLES)[number];

interface BundleData {
  name: BundleName;
  sitesCount: number;
  traffic: number;
  revenue: number;
  costs: number;
  profit: number;
  romi: number;
  revPer1000: number;
  healthScore: number;
  trafficDelta: number;
  revenueDelta: number;
  costsDelta: number;
  profitDelta: number;
  romiDelta: number;
  revPer1000Delta: number;
}

const bundlesData: BundleData[] = [
  {
    name: "Gays",
    sitesCount: 10,
    traffic: 1_245_000,
    revenue: 18_750,
    costs: 6_200,
    profit: 12_550,
    romi: 202.4,
    revPer1000: 15.06,
    healthScore: 87,
    trafficDelta: 5.2,
    revenueDelta: 8.1,
    costsDelta: 2.3,
    profitDelta: 11.4,
    romiDelta: 5.7,
    revPer1000Delta: 2.8,
  },
  {
    name: "Trans",
    sitesCount: 10,
    traffic: 892_000,
    revenue: 14_320,
    costs: 5_100,
    profit: 9_220,
    romi: 180.8,
    revPer1000: 16.05,
    healthScore: 74,
    trafficDelta: -2.1,
    revenueDelta: 3.4,
    costsDelta: 6.8,
    profitDelta: 1.2,
    romiDelta: -3.2,
    revPer1000Delta: 5.6,
  },
  {
    name: "Hentai",
    sitesCount: 10,
    traffic: 2_130_000,
    revenue: 28_400,
    costs: 9_800,
    profit: 18_600,
    romi: 189.8,
    revPer1000: 13.33,
    healthScore: 92,
    trafficDelta: 12.3,
    revenueDelta: 15.6,
    costsDelta: 4.1,
    profitDelta: 21.2,
    romiDelta: 11.1,
    revPer1000Delta: 2.9,
  },
  {
    name: "JAV",
    sitesCount: 10,
    traffic: 1_560_000,
    revenue: 21_800,
    costs: 8_400,
    profit: 13_400,
    romi: 159.5,
    revPer1000: 13.97,
    healthScore: 55,
    trafficDelta: -4.7,
    revenueDelta: -1.2,
    costsDelta: 8.9,
    profitDelta: -7.3,
    romiDelta: -9.3,
    revPer1000Delta: 3.7,
  },
];

// Aggregated totals
const totals = {
  traffic: bundlesData.reduce((s, b) => s + b.traffic, 0),
  revenue: bundlesData.reduce((s, b) => s + b.revenue, 0),
  costs: bundlesData.reduce((s, b) => s + b.costs, 0),
  profit: bundlesData.reduce((s, b) => s + b.profit, 0),
  get romi() {
    return this.costs === 0 ? 0 : ((this.revenue - this.costs) / this.costs) * 100;
  },
  get revPer1000() {
    return this.traffic === 0 ? 0 : (this.revenue / this.traffic) * 1000;
  },
};

const totalDeltas = {
  traffic: 4.1,
  revenue: 7.8,
  costs: 4.9,
  profit: 9.6,
  romi: 2.8,
  revPer1000: 3.5,
};

// Health counts
const healthCounts = {
  healthy: bundlesData.filter((b) => getHealthStatus(b.healthScore) === "healthy").length * 3 + 6,
  warning: bundlesData.filter((b) => getHealthStatus(b.healthScore) === "warning").length * 3 + 4,
  critical: bundlesData.filter((b) => getHealthStatus(b.healthScore) === "critical").length * 2 + 2,
};

// 7-day trend data
const trendData = [
  { date: "Mar 3", revenue: 10_850, costs: 3_920, profit: 6_930, romi: 176.8, traffic: 742_000 },
  { date: "Mar 4", revenue: 11_200, costs: 4_010, profit: 7_190, romi: 179.3, traffic: 768_000 },
  { date: "Mar 5", revenue: 10_560, costs: 3_780, profit: 6_780, romi: 179.4, traffic: 721_000 },
  { date: "Mar 6", revenue: 12_100, costs: 4_250, profit: 7_850, romi: 184.7, traffic: 810_000 },
  { date: "Mar 7", revenue: 12_650, costs: 4_180, profit: 8_470, romi: 202.6, traffic: 845_000 },
  { date: "Mar 8", revenue: 13_400, costs: 4_560, profit: 8_840, romi: 193.9, traffic: 892_000 },
  { date: "Mar 9", revenue: 12_510, costs: 4_800, profit: 7_710, romi: 160.6, traffic: 849_000 },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        positive ? "text-emerald-400" : "text-red-400"
      )}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary Card configs
// ---------------------------------------------------------------------------

const summaryCards = [
  {
    label: "Total Traffic",
    value: formatNumber(totals.traffic),
    delta: totalDeltas.traffic,
    icon: Users,
    iconColor: "text-blue-400",
  },
  {
    label: "Total Revenue",
    value: formatCurrency(totals.revenue),
    delta: totalDeltas.revenue,
    icon: DollarSign,
    iconColor: "text-emerald-400",
  },
  {
    label: "Total Costs",
    value: formatCurrency(totals.costs),
    delta: totalDeltas.costs,
    icon: BarChart3,
    iconColor: "text-red-400",
  },
  {
    label: "Total Profit",
    value: formatCurrency(totals.profit),
    delta: totalDeltas.profit,
    icon: Target,
    iconColor: "text-indigo-400",
  },
  {
    label: "Total ROMI",
    value: formatPercent(totals.romi),
    delta: totalDeltas.romi,
    icon: Activity,
    iconColor: "text-purple-400",
  },
  {
    label: "Revenue / 1K users",
    value: "$" + totals.revPer1000.toFixed(2),
    delta: totalDeltas.revPer1000,
    icon: DollarSign,
    iconColor: "text-amber-400",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "last_7_days" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    {card.label}
                  </span>
                  <Icon className={cn("h-4 w-4", card.iconColor)} />
                </div>
                <div className="mt-2 text-xl font-bold text-zinc-100">
                  {card.value}
                </div>
                <div className="mt-1">
                  <DeltaBadge value={card.delta} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Health overview */}
      <Card>
        <CardContent className="flex items-center gap-6 p-4">
          <span className="text-sm font-medium text-zinc-300">
            Sites Health Overview
          </span>
          <Badge variant="healthy" className="gap-1">
            <Heart className="h-3 w-3" />
            {healthCounts.healthy} Healthy
          </Badge>
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {healthCounts.warning} Warning
          </Badge>
          <Badge variant="critical" className="gap-1">
            <XCircle className="h-3 w-3" />
            {healthCounts.critical} Critical
          </Badge>
        </CardContent>
      </Card>

      {/* Bundles overview cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-200">
          Bundles Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bundlesData.map((bundle) => {
            const status = getHealthStatus(bundle.healthScore);
            return (
              <Link
                key={bundle.name}
                href={`/sites?bundle=${bundle.name.toLowerCase()}`}
                className="block transition-transform hover:scale-[1.01]"
              >
                <Card className="h-full hover:border-zinc-600">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {bundle.name}
                      </CardTitle>
                      <Badge variant={status}>
                        {bundle.healthScore} - {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Traffic</span>
                        <span className="flex items-center gap-2 text-zinc-100">
                          {formatNumber(bundle.traffic)}
                          <DeltaBadge value={bundle.trafficDelta} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Revenue</span>
                        <span className="flex items-center gap-2 text-zinc-100">
                          {formatCurrency(bundle.revenue)}
                          <DeltaBadge value={bundle.revenueDelta} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Costs</span>
                        <span className="flex items-center gap-2 text-zinc-100">
                          {formatCurrency(bundle.costs)}
                          <DeltaBadge value={bundle.costsDelta} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Profit</span>
                        <span className="flex items-center gap-2 text-zinc-100">
                          {formatCurrency(bundle.profit)}
                          <DeltaBadge value={bundle.profitDelta} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">ROMI</span>
                        <span className="flex items-center gap-2 text-zinc-100">
                          {formatPercent(bundle.romi)}
                          <DeltaBadge value={bundle.romiDelta} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Rev / 1K</span>
                        <span className="flex items-center gap-2 text-zinc-100">
                          ${bundle.revPer1000.toFixed(2)}
                          <DeltaBadge value={bundle.revPer1000Delta} />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bundles table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-200">
          Bundles Breakdown
        </h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead className="text-right">Sites</TableHead>
                <TableHead className="text-right">Traffic</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">ROMI</TableHead>
                <TableHead className="text-right">Rev / 1K</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundlesData.map((bundle) => {
                const status = getHealthStatus(bundle.healthScore);
                return (
                  <TableRow key={bundle.name}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sites?bundle=${bundle.name.toLowerCase()}`}
                        className="text-indigo-400 hover:underline"
                      >
                        {bundle.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {bundle.sitesCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(bundle.traffic)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bundle.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bundle.costs)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bundle.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(bundle.romi)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${bundle.revPer1000.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {bundle.healthScore}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge value={bundle.profitDelta} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Charts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-200">
          Trends (Last 7 Days)
        </h2>
        <DashboardCharts data={trendData} />
      </div>
    </div>
  );
}
