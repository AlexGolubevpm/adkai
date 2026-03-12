"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { KpiCard, KpiCardGrid } from "@/components/ui/kpi-card";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks";
import { PageSkeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Globe,
  DollarSign,
  Users,
  MousePointer,
  Eye,
  Target,
  BarChart3,
  Layers,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface WebsiteDetail {
  daily: {
    date: string;
    hits: number;
    clicks: number;
    impressions: number;
    brokerIncome: number;
    predictedIncome: number;
    ctr: number;
    fillRate: number;
    realCpm: number;
  }[];
  spots: {
    externalId: number;
    name: string;
    domain: string;
    hits: number;
    clicks: number;
    impressions: number;
    brokerIncome: number;
    ctr: number;
    fillRate: number;
    realCpm: number;
  }[];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] shadow-lg p-2.5">
      <p className="text-[11px] font-medium text-[var(--foreground-subtle)] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {p.name === "income" ? formatCurrency(p.value) : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function SiteDetailPage() {
  const params = useParams();
  const websiteId = params.id as string;
  const [tab, setTab] = useState("overview");

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
  }, []);

  const { data, loading } = useApi<WebsiteDetail>(
    `/api/asg/website/${websiteId}?from=${range.from}&to=${range.to}`
  );

  const totals = useMemo(() => {
    if (!data?.daily?.length) return null;
    return data.daily.reduce(
      (acc, d) => ({
        hits: acc.hits + d.hits,
        clicks: acc.clicks + d.clicks,
        impressions: acc.impressions + d.impressions,
        brokerIncome: acc.brokerIncome + d.brokerIncome,
      }),
      { hits: 0, clicks: 0, impressions: 0, brokerIncome: 0 }
    );
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map((d) => ({ date: d.date.slice(5), income: d.brokerIncome, hits: d.hits, clicks: d.clicks }));
  }, [data]);

  const kpiCards = totals
    ? [
        { label: "Total Hits", value: formatNumber(totals.hits), icon: Users, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", sparkline: data?.daily?.map((d) => d.hits) },
        { label: "Impressions", value: formatNumber(totals.impressions), icon: Eye, color: "var(--kpi-cyan)", bg: "var(--kpi-cyan-bg)", sparkline: data?.daily?.map((d) => d.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks), icon: MousePointer, color: "var(--kpi-amber)", bg: "var(--kpi-amber-bg)", sparkline: data?.daily?.map((d) => d.clicks) },
        { label: "Broker Income", value: formatCurrency(totals.brokerIncome), icon: DollarSign, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", sparkline: data?.daily?.map((d) => d.brokerIncome) },
        { label: "Avg CTR", value: (totals.hits > 0 ? (totals.clicks / totals.hits) * 100 : 0).toFixed(2) + "%", icon: Target, color: "var(--kpi-indigo)", bg: "var(--kpi-indigo-bg)" },
        { label: "Avg Fill Rate", value: (totals.hits > 0 ? (totals.impressions / totals.hits) * 100 : 0).toFixed(2) + "%", icon: Globe, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)" },
      ]
    : [];

  if (loading) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7"
    >
      {/* Back link */}
      <Link
        href="/sites"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sites
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-[var(--primary)]" />
        <h2 className="text-base font-semibold text-[var(--foreground)]">Website #{websiteId}</h2>
        <Badge variant="secondary">Last 30 days</Badge>
      </div>

      {/* KPI Cards */}
      <KpiCardGrid cols={6}>
        {kpiCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            sparklineData={card.sparkline}
          />
        ))}
      </KpiCardGrid>

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="spots">
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Ad Spots ({data?.spots?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="daily">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Daily Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Income Chart */}
                  <Card className="bg-[var(--surface-1)]">
                    <CardContent className="p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-3">Income (30 days)</p>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} width={40} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5, fill: "#22c55e", stroke: "white", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hits Chart */}
                  <Card className="bg-[var(--surface-1)]">
                    <CardContent className="p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-3">Hits (30 days)</p>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="hitsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} width={40} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="hits" stroke="#3b82f6" strokeWidth={2} fill="url(#hitsGrad)" dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "white", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="spots">
          {data?.spots && data.spots.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[var(--kpi-indigo)]" />
                  <CardTitle>Ad Spots</CardTitle>
                  <Badge variant="secondary">{data.spots.length} spots</Badge>
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Spot Name</TableHead>
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
                  {data.spots
                    .sort((a, b) => b.brokerIncome - a.brokerIncome)
                    .map((spot) => (
                      <TableRow key={spot.externalId}>
                        <TableCell className="font-medium text-[var(--foreground)]">{spot.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(spot.hits)}</TableCell>
                        <TableCell className="text-right">{formatNumber(spot.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(spot.clicks)}</TableCell>
                        <TableCell className="text-right font-semibold text-[var(--success)]">{formatCurrency(spot.brokerIncome)}</TableCell>
                        <TableCell className="text-right">{spot.ctr.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{spot.fillRate.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">${spot.realCpm.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="py-12 text-center">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30 text-[var(--foreground-subtle)]" />
              <p className="text-sm text-[var(--foreground-subtle)]">No ad spots data available</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily">
          {data?.daily && data.daily.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--kpi-blue)]" />
                  <CardTitle>Daily Breakdown</CardTitle>
                  <Badge variant="secondary">{data.daily.length} days</Badge>
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Fill Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.daily.map((d) => (
                    <TableRow key={d.date}>
                      <TableCell className="text-[var(--foreground-muted)]">{d.date}</TableCell>
                      <TableCell className="text-right">{formatNumber(d.hits)}</TableCell>
                      <TableCell className="text-right">{formatNumber(d.impressions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(d.clicks)}</TableCell>
                      <TableCell className="text-right font-semibold text-[var(--success)]">{formatCurrency(d.brokerIncome)}</TableCell>
                      <TableCell className="text-right">{d.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{d.fillRate.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="py-12 text-center">
              <p className="text-sm text-[var(--foreground-subtle)]">No daily data available</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
