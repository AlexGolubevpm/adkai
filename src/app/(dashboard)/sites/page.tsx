"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { useApi, periodToDateRange } from "@/lib/hooks";
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
} from "lucide-react";

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

type SortKey = "domain" | "hits" | "impressions" | "clicks" | "brokerIncome" | "ctr" | "fillRate" | "realCpm";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-zinc-600" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3 text-zinc-300" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3 text-zinc-300" />
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
    { key: "realCpm", label: "Real CPM", align: "text-right" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Sites</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live data from AdSpyGlass
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {websitesData && (
            <p className="text-sm text-zinc-500">
              Showing {sorted.length} of {websitesData.length} websites
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <span className="ml-3 text-zinc-400">Loading...</span>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn("cursor-pointer select-none whitespace-nowrap", col.align)}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortIcon(col.key)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((w) => (
                <TableRow key={w.externalId} className="group">
                  <TableCell>
                    <Link
                      href={`/sites/${w.externalId}`}
                      className="font-medium text-indigo-400 underline-offset-4 group-hover:underline"
                    >
                      {w.domain}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(w.hits)}</TableCell>
                  <TableCell className="text-right">{formatNumber(w.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(w.clicks)}</TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {formatCurrency(w.brokerIncome)}
                  </TableCell>
                  <TableCell className="text-right">{w.ctr.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{w.fillRate.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">${w.realCpm.toFixed(4)}</TableCell>
                </TableRow>
              ))}

              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                    No sites found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
