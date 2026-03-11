"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-xs shadow-xl shadow-black/30">
      <p className="font-medium text-[var(--foreground-subtle)] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold tabular-nums" style={{ color: p.color }}>
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
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
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
    return data.daily.map((d) => ({
      date: d.date.slice(5),
      income: d.brokerIncome,
      hits: d.hits,
      clicks: d.clicks,
    }));
  }, [data]);

  const kpiCards = totals
    ? [
        { label: "Total Hits", value: formatNumber(totals.hits), icon: Users, color: "#3b82f6" },
        { label: "Impressions", value: formatNumber(totals.impressions), icon: Eye, color: "#06b6d4" },
        { label: "Clicks", value: formatNumber(totals.clicks), icon: MousePointer, color: "#f59e0b" },
        { label: "Broker Income", value: formatCurrency(totals.brokerIncome), icon: DollarSign, color: "#22c55e" },
        { label: "Avg CTR", value: (totals.hits > 0 ? (totals.clicks / totals.hits) * 100 : 0).toFixed(2) + "%", icon: Target, color: "#6366f1" },
        { label: "Avg Fill Rate", value: (totals.hits > 0 ? (totals.impressions / totals.hits) * 100 : 0).toFixed(2) + "%", icon: Globe, color: "#a855f7" },
      ]
    : [];

  if (loading) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back + Header */}
      <div>
        <Link
          href="/sites"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Website #{websiteId}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
          Last 30 days performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 stagger-children">
        {kpiCards.map((card) => (
          <Card key={card.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-4 w-4" style={{ color: card.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: card.color }}>
                {card.value}
              </p>
            </CardContent>
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40"
              style={{ backgroundColor: card.color }}
            />
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spots">Ad Spots ({data?.spots?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {chartData.length > 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Income Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Income (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4, fill: "#22c55e", stroke: "var(--surface-1)", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Hits Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Hits (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="hitsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--foreground-subtle)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="hits" stroke="#3b82f6" strokeWidth={2} fill="url(#hitsGrad)" dot={false} activeDot={{ r: 4, fill: "#3b82f6", stroke: "var(--surface-1)", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="spots">
          {data?.spots && data.spots.length > 0 ? (
            <Card>
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
                        <TableCell className="font-medium text-[var(--foreground)]">
                          {spot.name}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                          {formatNumber(spot.hits)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                          {formatNumber(spot.impressions)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                          {formatNumber(spot.clicks)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-emerald-400">
                          {formatCurrency(spot.brokerIncome)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                          {spot.ctr.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                          {spot.fillRate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                          ${spot.realCpm.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-[var(--foreground-subtle)]">
                <Globe className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm">No ad spots data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily">
          {data?.daily && data.daily.length > 0 ? (
            <Card>
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
                      <TableCell className="text-[var(--foreground-muted)] tabular-nums">
                        {d.date}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {formatNumber(d.hits)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {formatNumber(d.impressions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {formatNumber(d.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-emerald-400">
                        {formatCurrency(d.brokerIncome)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {d.ctr.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-[var(--foreground-muted)]">
                        {d.fillRate.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-[var(--foreground-subtle)]">
                <p className="text-sm">No daily data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
