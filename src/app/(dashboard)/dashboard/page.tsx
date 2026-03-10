"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Target,
  Activity,
  Eye,
  MousePointer,
  Loader2,
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
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";
import DashboardCharts from "@/components/dashboard-charts";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useApi, periodToDateRange } from "@/lib/hooks";
import type { AsgReportRow } from "@/lib/adspyglass";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "yesterday" });

  const range = useMemo(
    () => periodToDateRange(period.preset, period.from, period.to),
    [period]
  );

  // Fetch totals
  const { data: totalsData, loading: totalsLoading } = useApi<AsgReportRow[]>(
    `/api/asg/report?from=${range.from}&to=${range.to}`
  );

  // Fetch per-website breakdown
  const { data: websitesData, loading: websitesLoading } = useApi<WebsiteRow[]>(
    `/api/asg/websites?from=${range.from}&to=${range.to}`
  );

  // Fetch daily trend
  const { data: dailyData } = useApi<AsgReportRow[]>(
    `/api/asg/report?from=${range.from}&to=${range.to}&group_by=date`
  );

  // Fetch ad-type breakdown
  const { data: adTypeData } = useApi<AsgReportRow[]>(
    `/api/asg/report?from=${range.from}&to=${range.to}&group_by=ad_type`
  );

  const totals = totalsData?.[0];
  const loading = totalsLoading || websitesLoading;

  // Build trend chart data
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

  // Summary cards
  const summaryCards = totals
    ? [
        { label: "Total Hits", value: formatNumber(totals.hits), icon: Users, iconColor: "text-blue-400" },
        { label: "Impressions", value: formatNumber(totals.impressions), icon: Eye, iconColor: "text-cyan-400" },
        { label: "Clicks", value: formatNumber(totals.clicks), icon: MousePointer, iconColor: "text-amber-400" },
        { label: "Broker Income", value: formatCurrency(totals.broker_income), icon: DollarSign, iconColor: "text-emerald-400" },
        { label: "CTR", value: totals.ctr.toFixed(2) + "%", icon: Target, iconColor: "text-indigo-400" },
        { label: "Fill Rate", value: totals.fill_rate.toFixed(2) + "%", icon: Activity, iconColor: "text-purple-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <span className="ml-3 text-zinc-400">Loading data from AdSpyGlass...</span>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">{card.label}</span>
                      <Icon className={cn("h-4 w-4", card.iconColor)} />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-100">{card.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Ad Type Breakdown */}
          {adTypeData && adTypeData.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-zinc-200">Ad Types</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {adTypeData
                  .filter((a) => a.hits > 0)
                  .sort((a, b) => b.broker_income - a.broker_income)
                  .map((adType) => (
                    <Card key={adType.name}>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-zinc-300">{adType.name}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Income</span>
                            <span className="text-emerald-400">{formatCurrency(adType.broker_income)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Hits</span>
                            <span className="text-zinc-300">{formatNumber(adType.hits)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">CTR</span>
                            <span className="text-zinc-300">{adType.ctr.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Fill Rate</span>
                            <span className="text-zinc-300">{adType.fill_rate.toFixed(2)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Websites Table */}
          {websitesData && websitesData.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-zinc-200">
                Websites ({websitesData.length})
              </h2>
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
                      <TableHead className="text-right">Real CPM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {websitesData
                      .sort((a, b) => b.brokerIncome - a.brokerIncome)
                      .map((w) => (
                        <TableRow key={w.externalId}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/sites/${w.externalId}`}
                              className="text-indigo-400 hover:underline"
                            >
                              {w.domain}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(w.hits)}</TableCell>
                          <TableCell className="text-right">{formatNumber(w.impressions)}</TableCell>
                          <TableCell className="text-right">{formatNumber(w.clicks)}</TableCell>
                          <TableCell className="text-right text-emerald-400">{formatCurrency(w.brokerIncome)}</TableCell>
                          <TableCell className="text-right">{w.ctr.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{w.fillRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">${w.realCpm.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Charts */}
          {trendData.length > 1 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-zinc-200">Daily Trends</h2>
              <DashboardCharts data={trendData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
