"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  Target,
  Activity,
  Eye,
  MousePointer,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";
import DashboardCharts from "@/components/dashboard-charts";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useApi, periodToDateRange } from "@/lib/hooks";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { AsgReportRow } from "@/lib/adspyglass";

interface WebsiteRow {
  externalId: number;
  domain: string;
  hits: number;
  clicks: number;
  impressions: number;
  brokerIncome: number;
  predictedIncome: number;
  ctr: number;
  fillRate: number;
  realCpm: number;
  brokerCpm: number;
  brokerCtr: number;
  discrepancy: number;
}

const kpiConfig = [
  { label: "Total Hits", key: "hits", icon: Users, color: "#3b82f6", format: formatNumber },
  { label: "Impressions", key: "impressions", icon: Eye, color: "#06b6d4", format: formatNumber },
  { label: "Clicks", key: "clicks", icon: MousePointer, color: "#f59e0b", format: formatNumber },
  { label: "Broker Income", key: "broker_income", icon: DollarSign, color: "#22c55e", format: formatCurrency },
  { label: "CTR", key: "ctr", icon: Target, color: "#6366f1", format: (v: number) => v.toFixed(2) + "%" },
  { label: "Fill Rate", key: "fill_rate", icon: Activity, color: "#a855f7", format: (v: number) => v.toFixed(2) + "%" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "yesterday" });

  const range = useMemo(
    () => periodToDateRange(period.preset, period.from, period.to),
    [period]
  );

  const { data: totalsData, loading: totalsLoading } = useApi<AsgReportRow[]>(
    `/api/asg/report?from=${range.from}&to=${range.to}`
  );

  const { data: websitesData, loading: websitesLoading } = useApi<WebsiteRow[]>(
    `/api/asg/websites?from=${range.from}&to=${range.to}`
  );

  const { data: dailyData } = useApi<AsgReportRow[]>(
    `/api/asg/report?from=${range.from}&to=${range.to}&group_by=date`
  );

  const { data: adTypeData } = useApi<AsgReportRow[]>(
    `/api/asg/report?from=${range.from}&to=${range.to}&group_by=ad_type`
  );

  const totals = totalsData?.[0];
  const loading = totalsLoading || websitesLoading;

  const trendData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.map((d) => ({
      date: d.name.slice(5),
      revenue: d.broker_income,
      costs: 0,
      profit: d.broker_income,
      romi: 0,
      traffic: d.hits,
    }));
  }, [dailyData]);

  const topSites = useMemo(() => {
    if (!websitesData) return [];
    return [...websitesData].sort((a, b) => b.brokerIncome - a.brokerIncome).slice(0, 10);
  }, [websitesData]);

  if (loading) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Performance overview for your ad network
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards */}
      {totals && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
        >
          {kpiConfig.map((kpi) => {
            const value = (totals as unknown as Record<string, number>)[kpi.key] ?? 0;
            return (
              <motion.div key={kpi.key} variants={item}>
                <Card className="relative overflow-hidden group hover:border-[var(--border-hover)] transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                        {kpi.label}
                      </span>
                      <kpi.icon
                        className="h-4 w-4 transition-colors"
                        style={{ color: kpi.color }}
                      />
                    </div>
                    <div
                      className="text-2xl font-bold tabular-nums tracking-tight"
                      style={{ color: kpi.color }}
                    >
                      {kpi.format(value)}
                    </div>
                  </CardContent>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40"
                    style={{ backgroundColor: kpi.color }}
                  />
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Ad Type Breakdown */}
      {adTypeData && adTypeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[var(--foreground-subtle)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Ad Formats</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {adTypeData
              .filter((a) => a.hits > 0)
              .sort((a, b) => b.broker_income - a.broker_income)
              .map((adType) => (
                <Card key={adType.name} className="hover:border-[var(--border-hover)] transition-colors">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-2">
                      {adType.name}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--foreground-subtle)]">Income</span>
                        <span className="font-medium tabular-nums text-emerald-600">
                          {formatCurrency(adType.broker_income)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--foreground-subtle)]">Hits</span>
                        <span className="tabular-nums text-[var(--foreground-muted)]">
                          {formatNumber(adType.hits)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--foreground-subtle)]">CTR</span>
                        <span className="tabular-nums text-[var(--foreground-muted)]">
                          {adType.ctr.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--foreground-subtle)]">Fill Rate</span>
                        <span className="tabular-nums text-[var(--foreground-muted)]">
                          {adType.fill_rate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </motion.div>
      )}

      {/* Top Websites */}
      {topSites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Top Websites
              </h2>
              <Badge variant="secondary">
                {websitesData?.length ?? 0} total
              </Badge>
            </div>
            <Link
              href="/sites"
              className="flex items-center gap-1 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">Hits</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Fill Rate</TableHead>
                  <TableHead className="text-right">eCPM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSites.map((w, idx) => (
                  <TableRow key={w.externalId} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-2)] text-[10px] font-bold tabular-nums text-[var(--foreground-subtle)]">
                          {idx + 1}
                        </span>
                        <Link
                          href={`/sites/${w.externalId}`}
                          className="font-medium text-[var(--foreground)] underline-offset-4 group-hover:text-indigo-600 transition-colors"
                        >
                          {w.domain}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                      {formatNumber(w.hits)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                      {formatNumber(w.impressions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                      {formatNumber(w.clicks)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-emerald-600">
                      {formatCurrency(w.brokerIncome)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                      {w.ctr.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                      {w.fillRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                      ${w.realCpm.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}

      {/* Charts */}
      {trendData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Daily Trends
          </h2>
          <DashboardCharts data={trendData} />
        </motion.div>
      )}
    </motion.div>
  );
}
