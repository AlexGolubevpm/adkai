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
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingUp,
  BarChart3,
  Globe,
  Search,
} from "lucide-react";
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
  {
    label: "Total Hits",
    key: "hits",
    icon: Users,
    color: "var(--kpi-blue)",
    bg: "var(--kpi-blue-bg)",
    format: formatNumber,
  },
  {
    label: "Impressions",
    key: "impressions",
    icon: Eye,
    color: "var(--kpi-cyan)",
    bg: "var(--kpi-cyan-bg)",
    format: formatNumber,
  },
  {
    label: "Clicks",
    key: "clicks",
    icon: MousePointer,
    color: "var(--kpi-amber)",
    bg: "var(--kpi-amber-bg)",
    format: formatNumber,
  },
  {
    label: "Broker Income",
    key: "broker_income",
    icon: DollarSign,
    color: "var(--kpi-green)",
    bg: "var(--kpi-green-bg)",
    format: formatCurrency,
  },
  {
    label: "CTR",
    key: "ctr",
    icon: Target,
    color: "var(--kpi-indigo)",
    bg: "var(--kpi-indigo-bg)",
    format: (v: number) => v.toFixed(2) + "%",
  },
  {
    label: "Fill Rate",
    key: "fill_rate",
    icon: Activity,
    color: "var(--kpi-purple)",
    bg: "var(--kpi-purple-bg)",
    format: (v: number) => v.toFixed(2) + "%",
  },
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
    >
      {/* Period Filter Bar */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "var(--section-gap)" }}
      >
        <div className="flex items-center gap-3">
          <BarChart3 style={{ width: 20, height: 20, color: "var(--primary)" }} />
          <span
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            Overview
          </span>
          <Badge variant="secondary" style={{ marginLeft: 4 }}>
            {range.from} — {range.to}
          </Badge>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* ── Section 1: KPI Cards ── */}
      {totals && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
            marginBottom: "var(--section-gap)",
          }}
        >
          {kpiConfig.map((kpi) => {
            const value = (totals as unknown as Record<string, number>)[kpi.key] ?? 0;
            const Icon = kpi.icon;
            return (
              <motion.div key={kpi.key} variants={item}>
                <div className="kpi-card">
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 16 }}
                  >
                    <div
                      className="kpi-icon"
                      style={{ background: kpi.bg, color: kpi.color }}
                    >
                      <Icon style={{ width: 18, height: 18 }} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ marginBottom: 6 }}>
                    {kpi.format(value)}
                  </div>
                  <div className="kpi-label">{kpi.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Section 2: Ad Formats Summary Panel ── */}
      {adTypeData && adTypeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="section-panel"
          style={{ marginBottom: "var(--section-gap)" }}
        >
          <div className="section-panel-header">
            <div className="flex items-center gap-2">
              <Zap style={{ width: 16, height: 16, color: "var(--kpi-amber)" }} />
              <span className="section-heading">Ad Formats</span>
              <Badge variant="secondary">
                {adTypeData.filter((a) => a.hits > 0).length} active
              </Badge>
            </div>
          </div>
          <div className="section-panel-content">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {adTypeData
                .filter((a) => a.hits > 0)
                .sort((a, b) => b.broker_income - a.broker_income)
                .map((adType) => (
                  <div
                    key={adType.name}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-1)",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-hover)";
                      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        marginBottom: 12,
                      }}
                    >
                      {adType.name}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xl)",
                        fontWeight: 700,
                        color: "var(--success)",
                        fontVariantNumeric: "tabular-nums",
                        marginBottom: 12,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatCurrency(adType.broker_income)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="flex justify-between" style={{ fontSize: "var(--text-xs)" }}>
                        <span style={{ color: "var(--foreground-subtle)" }}>Hits</span>
                        <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                          {formatNumber(adType.hits)}
                        </span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: "var(--text-xs)" }}>
                        <span style={{ color: "var(--foreground-subtle)" }}>CTR</span>
                        <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                          {adType.ctr.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: "var(--text-xs)" }}>
                        <span style={{ color: "var(--foreground-subtle)" }}>Fill Rate</span>
                        <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "var(--foreground-muted)" }}>
                          {adType.fill_rate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Section 3: Daily Trends Panel ── */}
      {trendData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="section-panel"
          style={{ marginBottom: "var(--section-gap)" }}
        >
          <div className="section-panel-header">
            <div className="flex items-center gap-2">
              <TrendingUp style={{ width: 16, height: 16, color: "var(--kpi-green)" }} />
              <span className="section-heading">Daily Trends</span>
            </div>
          </div>
          <div className="section-panel-content">
            <DashboardCharts data={trendData} />
          </div>
        </motion.div>
      )}

      {/* ── Section 4: Top Websites Data Table ── */}
      {topSites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="data-table-container">
            {/* Table Toolbar */}
            <div className="data-table-toolbar">
              <div className="flex items-center gap-3">
                <Globe style={{ width: 16, height: 16, color: "var(--kpi-blue)" }} />
                <span className="section-heading">Top Websites</span>
                <Badge variant="secondary">
                  {websitesData?.length ?? 0} total
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-1)",
                  }}
                >
                  <Search style={{ width: 14, height: 14, color: "var(--foreground-subtle)" }} />
                  <input
                    type="text"
                    placeholder="Search sites..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "var(--text-sm)",
                      color: "var(--foreground)",
                      width: 140,
                    }}
                  />
                </div>
                <Link
                  href="/sites"
                  className="flex items-center gap-1.5 transition-colors"
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    color: "var(--primary)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--primary)",
                    background: "var(--primary-light)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--primary)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--primary-light)";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                >
                  View all
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    background: "var(--surface-1)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <tr>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--foreground-subtle)",
                        textAlign: "left",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      Website
                    </th>
                    {["Hits", "Impressions", "Clicks", "Income", "CTR", "Fill Rate", "eCPM"].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-right"
                          style={{
                            padding: "12px 16px",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--foreground-subtle)",
                            textAlign: "right",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {topSites.map((w, idx) => (
                    <tr
                      key={w.externalId}
                      style={{
                        borderBottom: idx < topSites.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--surface-1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex items-center gap-3">
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: "var(--radius-md)",
                              background:
                                idx < 3 ? "var(--primary-light)" : "var(--surface-2)",
                              color:
                                idx < 3 ? "var(--primary)" : "var(--foreground-subtle)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <Link
                            href={`/sites/${w.externalId}`}
                            style={{
                              fontWeight: 500,
                              color: "var(--foreground)",
                              fontSize: "var(--text-sm)",
                              textDecoration: "none",
                              transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--foreground)";
                            }}
                          >
                            {w.domain}
                          </Link>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {formatNumber(w.hits)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {formatNumber(w.impressions)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {formatNumber(w.clicks)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                          color: "var(--success)",
                        }}
                      >
                        {formatCurrency(w.brokerIncome)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {w.ctr.toFixed(2)}%
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {w.fillRate.toFixed(2)}%
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        ${w.realCpm.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
