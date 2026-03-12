"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
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
          color: "var(--foreground-subtle)",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: p.color,
          }}
        >
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
        { label: "Total Hits", value: formatNumber(totals.hits), icon: Users, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)" },
        { label: "Impressions", value: formatNumber(totals.impressions), icon: Eye, color: "var(--kpi-cyan)", bg: "var(--kpi-cyan-bg)" },
        { label: "Clicks", value: formatNumber(totals.clicks), icon: MousePointer, color: "var(--kpi-amber)", bg: "var(--kpi-amber-bg)" },
        { label: "Broker Income", value: formatCurrency(totals.brokerIncome), icon: DollarSign, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)" },
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
    >
      {/* Back link */}
      <Link
        href="/sites"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--foreground)]"
        style={{ color: "var(--foreground-muted)", marginBottom: 20, display: "inline-flex" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sites
      </Link>

      {/* Header bar */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "var(--section-gap)" }}
      >
        <div className="flex items-center gap-3">
          <Globe style={{ width: 20, height: 20, color: "var(--primary)" }} />
          <span className="section-heading">Website #{websiteId}</span>
          <Badge variant="secondary">Last 30 days</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 16,
          marginBottom: "var(--section-gap)",
        }}
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="kpi-card">
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="kpi-icon" style={{ background: card.bg, color: card.color }}>
                  <Icon style={{ width: 18, height: 18 }} />
                </div>
              </div>
              <div className="kpi-value">{card.value}</div>
              <div className="kpi-label">{card.label}</div>
            </div>
          );
        })}
      </div>

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
            <div className="section-panel">
              <div className="section-panel-header">
                <span className="section-heading">Performance Charts</span>
              </div>
              <div className="section-panel-content">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {/* Income Chart */}
                  <div
                    style={{
                      padding: "20px 20px 16px",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-1)",
                    }}
                  >
                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--foreground-subtle)", marginBottom: 12 }}>
                      Income (30 days)
                    </p>
                    <div style={{ height: 200 }}>
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
                  </div>

                  {/* Hits Chart */}
                  <div
                    style={{
                      padding: "20px 20px 16px",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-1)",
                    }}
                  >
                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--foreground-subtle)", marginBottom: 12 }}>
                      Hits (30 days)
                    </p>
                    <div style={{ height: 200 }}>
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="spots">
          {data?.spots && data.spots.length > 0 ? (
            <div className="data-table-container">
              <div className="data-table-toolbar">
                <div className="flex items-center gap-3">
                  <Layers style={{ width: 16, height: 16, color: "var(--kpi-indigo)" }} />
                  <span className="section-heading">Ad Spots</span>
                  <Badge variant="secondary">{data.spots.length} spots</Badge>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--surface-1)" }}>
                    <tr>
                      {["Spot Name", "Hits", "Impressions", "Clicks", "Income", "CTR", "Fill Rate", "eCPM"].map((col, i) => (
                        <th
                          key={col}
                          style={{
                            padding: "12px 16px",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--foreground-subtle)",
                            textAlign: i === 0 ? "left" : "right",
                            borderBottom: "1px solid var(--border)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.spots
                      .sort((a, b) => b.brokerIncome - a.brokerIncome)
                      .map((spot, idx) => (
                        <tr
                          key={spot.externalId}
                          style={{
                            borderBottom: idx < data.spots.length - 1 ? "1px solid var(--border-subtle)" : "none",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "14px 16px", fontWeight: 500, color: "var(--foreground)", fontSize: "var(--text-sm)" }}>
                            {spot.name}
                          </td>
                          {[
                            formatNumber(spot.hits),
                            formatNumber(spot.impressions),
                            formatNumber(spot.clicks),
                          ].map((val, i) => (
                            <td key={i} style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                              {val}
                            </td>
                          ))}
                          <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--success)" }}>
                            {formatCurrency(spot.brokerIncome)}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                            {spot.ctr.toFixed(2)}%
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                            {spot.fillRate.toFixed(2)}%
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                            ${spot.realCpm.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="section-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
              <Globe style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.3, color: "var(--foreground-subtle)" }} />
              <p style={{ fontSize: "var(--text-sm)", color: "var(--foreground-subtle)" }}>No ad spots data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily">
          {data?.daily && data.daily.length > 0 ? (
            <div className="data-table-container">
              <div className="data-table-toolbar">
                <div className="flex items-center gap-3">
                  <Calendar style={{ width: 16, height: 16, color: "var(--kpi-blue)" }} />
                  <span className="section-heading">Daily Breakdown</span>
                  <Badge variant="secondary">{data.daily.length} days</Badge>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--surface-1)" }}>
                    <tr>
                      {["Date", "Hits", "Impressions", "Clicks", "Income", "CTR", "Fill Rate"].map((col, i) => (
                        <th
                          key={col}
                          style={{
                            padding: "12px 16px",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--foreground-subtle)",
                            textAlign: i === 0 ? "left" : "right",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((d, idx) => (
                      <tr
                        key={d.date}
                        style={{
                          borderBottom: idx < data.daily.length - 1 ? "1px solid var(--border-subtle)" : "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "14px 16px", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)", fontSize: "var(--text-sm)" }}>
                          {d.date}
                        </td>
                        {[formatNumber(d.hits), formatNumber(d.impressions), formatNumber(d.clicks)].map((val, i) => (
                          <td key={i} style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                            {val}
                          </td>
                        ))}
                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--success)" }}>
                          {formatCurrency(d.brokerIncome)}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                          {d.ctr.toFixed(2)}%
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                          {d.fillRate.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="section-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--foreground-subtle)" }}>No daily data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
