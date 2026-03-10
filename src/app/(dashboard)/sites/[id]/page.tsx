"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks";
import {
  ArrowLeft,
  Globe,
  DollarSign,
  Users,
  MousePointer,
  Eye,
  Target,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-zinc-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name === "income" ? formatCurrency(p.value) : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SiteDetailPage() {
  const params = useParams();
  const websiteId = params.id as string;

  // Fetch last 30 days of data
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

  // Totals from daily data
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

  // Chart data
  const chartData = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map((d) => ({
      date: d.date.slice(5),
      income: d.brokerIncome,
      hits: d.hits,
      clicks: d.clicks,
    }));
  }, [data]);

  const overviewCards = totals
    ? [
        { label: "Total Hits", value: formatNumber(totals.hits), icon: Users, color: "text-blue-400" },
        { label: "Impressions", value: formatNumber(totals.impressions), icon: Eye, color: "text-cyan-400" },
        { label: "Clicks", value: formatNumber(totals.clicks), icon: MousePointer, color: "text-amber-400" },
        { label: "Broker Income", value: formatCurrency(totals.brokerIncome), icon: DollarSign, color: "text-emerald-400" },
        { label: "Avg CTR", value: (totals.hits > 0 ? (totals.clicks / totals.hits) * 100 : 0).toFixed(2) + "%", icon: Target, color: "text-indigo-400" },
        { label: "Avg Fill Rate", value: (totals.hits > 0 ? (totals.impressions / totals.hits) * 100 : 0).toFixed(2) + "%", icon: Globe, color: "text-violet-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href="/sites"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-100">
            Website #{websiteId}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <span className="ml-3 text-zinc-400">Loading website data...</span>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {overviewCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <card.icon className={cn("h-4 w-4", card.color)} />
                    <span className="text-xs text-zinc-400">{card.label}</span>
                  </div>
                  <p className={cn("mt-2 text-2xl font-bold", card.color)}>
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trend Charts */}
          {chartData.length > 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Income (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hits (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="hits" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Spots Breakdown */}
          {data?.spots && data.spots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ad Spots ({data.spots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      <TableHead className="text-right">Real CPM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.spots
                      .sort((a, b) => b.brokerIncome - a.brokerIncome)
                      .map((spot) => (
                        <TableRow key={spot.externalId}>
                          <TableCell className="font-medium">{spot.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(spot.hits)}</TableCell>
                          <TableCell className="text-right">{formatNumber(spot.impressions)}</TableCell>
                          <TableCell className="text-right">{formatNumber(spot.clicks)}</TableCell>
                          <TableCell className="text-right text-emerald-400">
                            {formatCurrency(spot.brokerIncome)}
                          </TableCell>
                          <TableCell className="text-right">{spot.ctr.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{spot.fillRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">${spot.realCpm.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Daily Breakdown Table */}
          {data?.daily && data.daily.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
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
                        <TableCell className="text-zinc-400">{d.date}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.hits)}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.clicks)}</TableCell>
                        <TableCell className="text-right text-emerald-400">
                          {formatCurrency(d.brokerIncome)}
                        </TableCell>
                        <TableCell className="text-right">{d.ctr.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{d.fillRate.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
