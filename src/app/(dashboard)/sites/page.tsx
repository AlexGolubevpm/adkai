"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-[var(--foreground-subtle)] opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-indigo-400" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-indigo-400" />
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

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: "domain", label: "Website" },
    { key: "hits", label: "Hits", align: "text-right" },
    { key: "impressions", label: "Impressions", align: "text-right" },
    { key: "clicks", label: "Clicks", align: "text-right" },
    { key: "brokerIncome", label: "Income", align: "text-right" },
    { key: "ctr", label: "CTR", align: "text-right" },
    { key: "fillRate", label: "Fill Rate", align: "text-right" },
    { key: "realCpm", label: "eCPM", align: "text-right" },
  ];

  // Totals row
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
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Sites</h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Live data from AdSpyGlass
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Search & stats bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
          <Input
            className="pl-9 bg-[var(--surface-1)]"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {websitesData && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Globe className="mr-1 h-3 w-3" />
              {sorted.length} of {websitesData.length}
            </Badge>
            {totals && (
              <Badge variant="healthy">
                {formatCurrency(totals.brokerIncome)} total
              </Badge>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={12} cols={8} />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "cursor-pointer select-none whitespace-nowrap group/th",
                      col.align
                    )}
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
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold tabular-nums text-[var(--foreground-subtle)] bg-[var(--surface-2)]">
                        {idx + 1}
                      </span>
                      <Link
                        href={`/sites/${w.externalId}`}
                        className="font-medium text-[var(--foreground)] underline-offset-4 group-hover:text-indigo-400 transition-colors"
                      >
                        {w.domain}
                      </Link>
                      <ExternalLink className="h-3 w-3 text-[var(--foreground-subtle)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <TableCell className="text-right tabular-nums font-medium text-emerald-400">
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

              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--foreground-subtle)]">
                      <Globe className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No sites found</p>
                      {search && (
                        <p className="text-xs">Try adjusting your search query</p>
                      )}
                    </div>
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
