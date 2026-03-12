"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useApi, periodToDateRange } from "@/lib/hooks";
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Globe,
  ExternalLink,
  DollarSign,
  Users,
} from "lucide-react";

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

type SortKey = "domain" | "hits" | "impressions" | "clicks" | "brokerIncome" | "ctr" | "fillRate" | "realCpm";
type SortDir = "asc" | "desc";

export default function SitesPage() {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "yesterday" });
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("brokerIncome");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const range = useMemo(
    () => periodToDateRange(period.preset, period.from, period.to),
    [period]
  );

  const { data: websitesData, loading } = useApi<WebsiteRow[]>(
    `/api/asg/websites?from=${range.from}&to=${range.to}`
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-0 group-hover/th:opacity-100 transition-opacity" style={{ color: "var(--foreground-subtle)" }} />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" style={{ color: "var(--primary)" }} />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" style={{ color: "var(--primary)" }} />
    );
  };

  const sorted = useMemo(() => {
    if (!websitesData) return [];
    let list = websitesData;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.domain.toLowerCase().includes(q));
    }

    const copy = [...list];
    const dir = sortDir === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      switch (sortKey) {
        case "domain":
          return dir * a.domain.localeCompare(b.domain);
        default:
          return dir * ((a[sortKey] as number) - (b[sortKey] as number));
      }
    });

    return copy;
  }, [websitesData, search, sortKey, sortDir]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "domain", label: "Website" },
    { key: "hits", label: "Hits" },
    { key: "impressions", label: "Impressions" },
    { key: "clicks", label: "Clicks" },
    { key: "brokerIncome", label: "Income" },
    { key: "ctr", label: "CTR" },
    { key: "fillRate", label: "Fill Rate" },
    { key: "realCpm", label: "eCPM" },
  ];

  const totals = useMemo(() => {
    if (!sorted.length) return null;
    return sorted.reduce(
      (acc, w) => ({
        hits: acc.hits + w.hits,
        impressions: acc.impressions + w.impressions,
        clicks: acc.clicks + w.clicks,
        brokerIncome: acc.brokerIncome + w.brokerIncome,
      }),
      { hits: 0, impressions: 0, clicks: 0, brokerIncome: 0 }
    );
  }, [sorted]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "var(--section-gap)" }}
      >
        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Summary KPIs */}
      {websitesData && totals && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: "var(--section-gap)",
          }}
        >
          <div className="kpi-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="kpi-icon" style={{ background: "var(--kpi-blue-bg)", color: "var(--kpi-blue)" }}>
                <Globe style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="kpi-value">{websitesData.length}</div>
            <div className="kpi-label">Total Sites</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="kpi-icon" style={{ background: "var(--kpi-green-bg)", color: "var(--kpi-green)" }}>
                <DollarSign style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(totals.brokerIncome)}</div>
            <div className="kpi-label">Total Income</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="kpi-icon" style={{ background: "var(--kpi-cyan-bg)", color: "var(--kpi-cyan)" }}>
                <Users style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div className="kpi-value">{formatNumber(totals.hits)}</div>
            <div className="kpi-label">Total Hits</div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <TableSkeleton rows={12} cols={8} />
      ) : (
        <div className="data-table-container">
          <div className="data-table-toolbar">
            <div className="flex items-center gap-3">
              <Globe style={{ width: 16, height: 16, color: "var(--kpi-blue)" }} />
              <span className="section-heading">All Websites</span>
              <Badge variant="secondary">
                {sorted.length} of {websitesData?.length ?? 0}
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "var(--text-sm)",
                    color: "var(--foreground)",
                    width: 160,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "var(--surface-1)" }}>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="group/th"
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: "12px 16px",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--foreground-subtle)",
                        textAlign: col.key === "domain" ? "left" : "right",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                      <SortIcon colKey={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((w, idx) => (
                  <tr
                    key={w.externalId}
                    className="group"
                    style={{
                      borderBottom: idx < sorted.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: "var(--radius-sm)",
                            background: idx < 3 ? "var(--primary-light)" : "var(--surface-2)",
                            color: idx < 3 ? "var(--primary)" : "var(--foreground-subtle)",
                            fontSize: "10px",
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
                          }}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {w.domain}
                        </Link>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--foreground-subtle)" }} />
                      </div>
                    </td>
                    {[
                      { value: formatNumber(w.hits), color: "var(--foreground-muted)" },
                      { value: formatNumber(w.impressions), color: "var(--foreground-muted)" },
                      { value: formatNumber(w.clicks), color: "var(--foreground-muted)" },
                      { value: formatCurrency(w.brokerIncome), color: "var(--success)", fontWeight: 600 },
                      { value: `${w.ctr.toFixed(2)}%`, color: "var(--foreground-muted)" },
                      { value: `${w.fillRate.toFixed(2)}%`, color: "var(--foreground-muted)" },
                      { value: `$${w.realCpm.toFixed(4)}`, color: "var(--foreground-muted)" },
                    ].map((cell, i) => (
                      <td
                        key={i}
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontSize: "var(--text-sm)",
                          fontVariantNumeric: "tabular-nums",
                          color: cell.color,
                          fontWeight: (cell as { fontWeight?: number }).fontWeight || 400,
                        }}
                      >
                        {cell.value}
                      </td>
                    ))}
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        padding: "48px 16px",
                        textAlign: "center",
                        color: "var(--foreground-subtle)",
                      }}
                    >
                      <Globe style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: "var(--text-sm)" }}>No sites found</p>
                      {search && (
                        <p style={{ fontSize: "var(--text-xs)", marginTop: 4 }}>
                          Try adjusting your search query
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
