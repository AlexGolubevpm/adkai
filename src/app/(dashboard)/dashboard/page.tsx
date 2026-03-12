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
  TrendingUp,
  Globe,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { KpiCard, KpiCardGrid } from "@/components/ui/kpi-card";
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
  { label: "Total Hits", key: "hits", icon: Users, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", format: formatNumber, tooltip: "Total page views across all sites" },
  { label: "Impressions", key: "impressions", icon: Eye, color: "var(--kpi-cyan)", bg: "var(--kpi-cyan-bg)", format: formatNumber, tooltip: "Total ad impressions served" },
  { label: "Clicks", key: "clicks", icon: MousePointer, color: "var(--kpi-amber)", bg: "var(--kpi-amber-bg)", format: formatNumber, tooltip: "Total ad clicks recorded" },
  { label: "Broker Income", key: "broker_income", icon: DollarSign, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", format: formatCurrency, tooltip: "Total revenue from ad broker" },
  { label: "CTR", key: "ctr", icon: Target, color: "var(--kpi-indigo)", bg: "var(--kpi-indigo-bg)", format: (v: number) => v.toFixed(2) + "%", tooltip: "Click-through rate = Clicks / Hits" },
  { label: "Fill Rate", key: "fill_rate", icon: Activity, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", format: (v: number) => v.toFixed(2) + "%", tooltip: "Impressions / Hits ratio" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "yesterday" });
  const [tableSearch, setTableSearch] = useState("");

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
    let filtered = [...websitesData].sort((a, b) => b.brokerIncome - a.brokerIncome);
    if (tableSearch) {
      filtered = filtered.filter((w) =>
        w.domain.toLowerCase().includes(tableSearch.toLowerCase())
      );
    }
    return filtered.slice(0, 10);
  }, [websitesData, tableSearch]);

  if (loading) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7"
    >
      {/* Period Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {range.from} — {range.to}
          </Badge>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards */}
      {totals && (
        <KpiCardGrid cols={6}>
          {kpiConfig.map((kpi) => {
            const value = (totals as unknown as Record<string, number>)[kpi.key] ?? 0;
            const sparkline = dailyData?.map((d) => (d as unknown as Record<string, number>)[kpi.key] ?? 0);
            return (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={kpi.format(value)}
                icon={kpi.icon}
                color={kpi.color}
                bg={kpi.bg}
                tooltip={kpi.tooltip}
                sparklineData={sparkline}
              />
            );
          })}
        </KpiCardGrid>
      )}

      {/* Ad Formats Summary */}
      {adTypeData && adTypeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--kpi-amber)]" />
                <CardTitle>Ad Formats</CardTitle>
                <Badge variant="secondary">
                  {adTypeData.filter((a) => a.hits > 0).length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {adTypeData
                  .filter((a) => a.hits > 0)
                  .sort((a, b) => b.broker_income - a.broker_income)
                  .map((adType) => (
                    <Card key={adType.name} className="bg-[var(--surface-1)] hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-sm)] transition-all">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-[var(--foreground)] mb-2">{adType.name}</p>
                        <p className="text-xl font-bold tabular-nums text-[var(--success)] tracking-tight mb-3">
                          {formatCurrency(adType.broker_income)}
                        </p>
                        <div className="space-y-1.5">
                          {[
                            { label: "Hits", value: formatNumber(adType.hits) },
                            { label: "CTR", value: `${adType.ctr.toFixed(2)}%` },
                            { label: "Fill Rate", value: `${adType.fill_rate.toFixed(2)}%` },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between text-[11px]">
                              <span className="text-[var(--foreground-subtle)]">{row.label}</span>
                              <span className="font-medium tabular-nums text-[var(--foreground-muted)]">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily Trends */}
      {trendData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--kpi-green)]" />
                <CardTitle>Daily Trends</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DashboardCharts data={trendData} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Websites Table */}
      {topSites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--kpi-blue)]" />
                  <CardTitle>Top Websites</CardTitle>
                  <Badge variant="secondary">{websitesData?.length ?? 0} total</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <Input
                      placeholder="Search sites..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-9 h-8 w-44 text-sm"
                    />
                  </div>
                  <Link
                    href="/sites"
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-secondary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </CardHeader>
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
                  <TableRow key={w.externalId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold tabular-nums shrink-0",
                            idx < 3
                              ? "bg-[var(--primary-light)] text-[var(--primary)]"
                              : "bg-[var(--surface-2)] text-[var(--foreground-subtle)]"
                          )}
                        >
                          {idx + 1}
                        </span>
                        <Link
                          href={`/sites/${w.externalId}`}
                          className="font-medium text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                        >
                          {w.domain}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(w.hits)}</TableCell>
                    <TableCell className="text-right">{formatNumber(w.impressions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(w.clicks)}</TableCell>
                    <TableCell className="text-right font-semibold text-[var(--success)]">
                      {formatCurrency(w.brokerIncome)}
                    </TableCell>
                    <TableCell className="text-right">{w.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{w.fillRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">${w.realCpm.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
