"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-0 group-hover/th:opacity-100 transition-opacity text-[var(--foreground-subtle)]" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
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
      if (sortKey === "domain") return dir * a.domain.localeCompare(b.domain);
      return dir * ((a[sortKey] as number) - (b[sortKey] as number));
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
      className="space-y-7"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Summary KPIs */}
      {websitesData && totals && (
        <KpiCardGrid cols={3}>
          <KpiCard label="Total Sites" value={websitesData.length} icon={Globe} color="var(--kpi-blue)" bg="var(--kpi-blue-bg)" tooltip="Number of websites tracked" />
          <KpiCard label="Total Income" value={formatCurrency(totals.brokerIncome)} icon={DollarSign} color="var(--kpi-green)" bg="var(--kpi-green-bg)" tooltip="Total broker income" />
          <KpiCard label="Total Hits" value={formatNumber(totals.hits)} icon={Users} color="var(--kpi-cyan)" bg="var(--kpi-cyan-bg)" tooltip="Total page views" />
        </KpiCardGrid>
      )}

      {/* Data Table */}
      {loading ? (
        <TableSkeleton rows={12} cols={8} />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[var(--kpi-blue)]" />
                <CardTitle>All Websites</CardTitle>
                <Badge variant="secondary">{sorted.length} of {websitesData?.length ?? 0}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                <Input placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 w-48 text-sm" />
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn("cursor-pointer select-none group/th", col.key !== "domain" && "text-right")}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon colKey={col.key} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((w, idx) => (
                <TableRow key={w.externalId} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold tabular-nums shrink-0", idx < 3 ? "bg-[var(--primary-light)] text-[var(--primary)]" : "bg-[var(--surface-2)] text-[var(--foreground-subtle)]")}>
                        {idx + 1}
                      </span>
                      <Link href={`/sites/${w.externalId}`} className="font-medium text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                        {w.domain}
                      </Link>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--foreground-subtle)]" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(w.hits)}</TableCell>
                  <TableCell className="text-right">{formatNumber(w.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(w.clicks)}</TableCell>
                  <TableCell className="text-right font-semibold text-[var(--success)]">{formatCurrency(w.brokerIncome)}</TableCell>
                  <TableCell className="text-right">{w.ctr.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{w.fillRate.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">${w.realCpm.toFixed(4)}</TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-30 text-[var(--foreground-subtle)]" />
                    <p className="text-sm text-[var(--foreground-subtle)]">No sites found</p>
                    {search && <p className="text-xs text-[var(--foreground-disabled)] mt-1">Try adjusting your search query</p>}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </motion.div>
  );
}
